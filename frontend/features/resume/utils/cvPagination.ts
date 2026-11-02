export type PaginationItem = {
  id: string;
  h: number;
  /** Never end a page right after this item (orphan/widow control for text lines). */
  keepWithNext?: boolean;
};

export type SectionMeasurement = {
  id: string;
  /** Whole section height including its own margins. */
  height: number;
  /** Section title (h3) height including margins; repeated on every page the section spans. */
  titleHeight: number;
  /** The section's own vertical margins, added once after its last chunk. */
  spacing: number;
  /** Pieces the section can be split into; without them the section moves as a whole. */
  items?: PaginationItem[];
};

export type SectionChunk = { sectionId: string; items?: string[]; includeTitle?: boolean };

// Last index of the run starting at `start` that has to stay on one page.
const keptTogetherEnd = (items: PaginationItem[], start: number) => {
  let end = start;
  while (end < items.length - 1 && items[end].keepWithNext) end++;
  return end;
};

/**
 * Packs measured sections onto pages of `pageHeight` px. The first page starts at
 * `firstPageOffset` (the CV header). A section that does not fit is split between its
 * items; only an item taller than a whole page is placed anyway and overflows.
 */
export const paginateSections = (
  sections: SectionMeasurement[],
  { pageHeight, firstPageOffset }: { pageHeight: number; firstPageOffset: number }
): SectionChunk[][] => {
  const pages: SectionChunk[][] = [];
  let current: SectionChunk[] = [];
  let used = firstPageOffset;

  const startNewPage = () => {
    pages.push(current);
    current = [];
    used = 0;
  };

  for (const section of sections) {
    if (section.height <= 0) continue;

    if (used + section.height <= pageHeight) {
      current.push({ sectionId: section.id, includeTitle: true });
      used += section.height;
      continue;
    }

    const items = section.items;
    if (!items?.length) {
      // No way to split; move to next page if not empty, then place it (may overflow)
      if (used > 0) startNewPage();
      current.push({ sectionId: section.id, includeTitle: true });
      used = section.height;
      continue;
    }

    let index = 0;
    while (index < items.length) {
      const chunk: string[] = [];
      let chunkHeight = section.titleHeight;

      while (index < items.length) {
        const groupEnd = keptTogetherEnd(items, index);
        const group = items.slice(index, groupEnd + 1);
        const groupHeight = group.reduce((sum, item) => sum + item.h, 0);
        // A group that cannot fit even on an empty page gives up keeping together
        const unit = section.titleHeight + groupHeight <= pageHeight ? group : [items[index]];
        const unitHeight = unit === group ? groupHeight : items[index].h;

        if (used + chunkHeight + unitHeight <= pageHeight) {
          chunk.push(...unit.map((item) => item.id));
          chunkHeight += unitHeight;
          index += unit.length;
          continue;
        }

        // Continue on the next page; the title never stays there alone
        if (chunk.length > 0 || used > 0) break;

        // Already on an empty page: the item is taller than a page, place it anyway
        chunk.push(items[index].id);
        chunkHeight += items[index].h;
        index++;
      }

      if (chunk.length) {
        current.push({ sectionId: section.id, includeTitle: true, items: chunk });
        used += chunkHeight;
      }
      if (index < items.length) startNewPage();
    }

    used += section.spacing;
  }

  if (current.length) pages.push(current);
  return pages;
};

/**
 * Splits a plain-text paragraph into the lines the browser wrapped it into, so long
 * text can continue on the next page. Ids are `p{index}:{start}-{end}` character
 * ranges; a single-line paragraph stays one `p{index}` item. The first two and the
 * last two lines are kept together so no line is left alone on a page.
 */
export const measureParagraphLines = (paragraph: HTMLElement, index: number): PaginationItem[] => {
  const style = getComputedStyle(paragraph);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const whole = [{ id: `p${index}`, h: paragraph.offsetHeight + marginTop + marginBottom }];

  const textNode = paragraph.firstChild;
  if (paragraph.childNodes.length !== 1 || textNode?.nodeType !== Node.TEXT_NODE) return whole;

  const text = textNode.textContent ?? '';
  const range = document.createRange();
  const lines: Array<{ start: number; top: number }> = [];
  for (const word of text.matchAll(/\S+/g)) {
    range.setStart(textNode, word.index);
    range.setEnd(textNode, word.index + 1);
    const { top } = range.getBoundingClientRect();
    const last = lines[lines.length - 1];
    if (!last || top > last.top + 1) lines.push({ start: last ? word.index : 0, top });
  }
  if (lines.length < 2) return whole;

  const rect = paragraph.getBoundingClientRect();
  // Line boundaries: paragraph top, each next line's offset from the first, paragraph bottom
  const bounds = [
    rect.top,
    ...lines.slice(1).map((line) => rect.top + line.top - lines[0].top),
    rect.bottom,
  ];

  return lines.map((line, i) => {
    const end = lines[i + 1]?.start ?? text.length;
    const isLast = i === lines.length - 1;
    return {
      id: `p${index}:${line.start}-${end}`,
      h: bounds[i + 1] - bounds[i] + (i === 0 ? marginTop : 0) + (isLast ? marginBottom : 0),
      keepWithNext: i === 0 || i === lines.length - 2,
    };
  });
};

/**
 * Turns the paragraph items placed on one page (`p{index}` or line ranges from
 * `measureParagraphLines`) back into the text to render, one entry per paragraph.
 */
export const getParagraphFragments = (paragraphs: string[], itemIds: string[]) => {
  const ranges = new Map<number, { start: number; end: number }>();

  for (const id of itemIds) {
    const match = /^p(\d+)(?::(\d+)-(\d+))?$/.exec(id);
    if (!match) continue;
    const index = Number(match[1]);
    const text = paragraphs[index];
    if (text === undefined) continue;

    const start = match[2] === undefined ? 0 : Number(match[2]);
    const end = match[3] === undefined ? text.length : Number(match[3]);
    const range = ranges.get(index);
    ranges.set(
      index,
      range
        ? { start: Math.min(range.start, start), end: Math.max(range.end, end) }
        : { start, end }
    );
  }

  return [...ranges.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, { start, end }]) => ({ index, text: paragraphs[index].slice(start, end) }));
};
