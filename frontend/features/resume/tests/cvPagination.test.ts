import { describe, expect, it } from 'vitest';

import {
  getParagraphFragments,
  paginateSections,
  type PaginationItem,
  type SectionChunk,
  type SectionMeasurement,
} from '../utils/cvPagination';

const PAGE = 1000;
const TITLE = 30;

const listSection = (id: string, items: PaginationItem[], spacing = 0): SectionMeasurement => ({
  id,
  height: TITLE + items.reduce((sum, item) => sum + item.h, 0) + spacing,
  titleHeight: TITLE,
  spacing,
  items,
});

const fixedSection = (id: string, height: number): SectionMeasurement => ({
  id,
  height,
  titleHeight: TITLE,
  spacing: 0,
});

// Mirrors what measureParagraphLines returns for a paragraph of `count` lines
const textLines = (count: number, h = 20): PaginationItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p0:${i * 10}-${(i + 1) * 10}`,
    h,
    keepWithNext: i === 0 || i === count - 2,
  }));

// Content height of each page, rebuilt from the chunks
const pageHeights = (
  pages: SectionChunk[][],
  sections: SectionMeasurement[],
  firstPageOffset: number
) =>
  pages.map((page, index) =>
    page.reduce(
      (sum, chunk) => {
        const section = sections.find((s) => s.id === chunk.sectionId)!;
        if (!chunk.items) return sum + section.height;
        const items = section.items!.filter((item) => chunk.items!.includes(item.id));
        return sum + section.titleHeight + items.reduce((acc, item) => acc + item.h, 0);
      },
      index === 0 ? firstPageOffset : 0
    )
  );

describe('paginateSections', () => {
  it('keeps sections whole while they fit', () => {
    const sections = [
      fixedSection('skills', 300),
      listSection('experience', [{ id: 'a', h: 200 }]),
    ];

    expect(paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 100 })).toEqual([
      [
        { sectionId: 'skills', includeTitle: true },
        { sectionId: 'experience', includeTitle: true },
      ],
    ]);
  });

  it('moves an item that only fits on an empty page instead of letting it overflow', () => {
    const sections = [
      fixedSection('skills', 800),
      listSection('experience', [
        { id: 'a', h: 300 },
        { id: 'b', h: 100 },
      ]),
    ];

    const pages = paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 });

    expect(pages).toEqual([
      [{ sectionId: 'skills', includeTitle: true }],
      [{ sectionId: 'experience', includeTitle: true, items: ['a', 'b'] }],
    ]);
    expect(Math.max(...pageHeights(pages, sections, 0))).toBeLessThanOrEqual(PAGE);
  });

  it('does not leave a section title alone at the bottom of a page', () => {
    const sections = [
      fixedSection('skills', 900),
      listSection('experience', [{ id: 'a', h: 200 }]),
    ];

    expect(paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 })).toEqual([
      [{ sectionId: 'skills', includeTitle: true }],
      [{ sectionId: 'experience', includeTitle: true, items: ['a'] }],
    ]);
  });

  it('flows a paragraph longer than a page over as many pages as it needs', () => {
    const sections = [fixedSection('skills', 400), listSection('privacy', textLines(120))];

    const pages = paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 100 });
    const placed = pages.flat().flatMap((chunk) => chunk.items ?? []);

    expect(pages).toHaveLength(4);
    expect(placed).toEqual(sections[1].items!.map((item) => item.id));
    expect(Math.max(...pageHeights(pages, sections, 100))).toBeLessThanOrEqual(PAGE);
  });

  it('never leaves a single line of a paragraph alone on a page', () => {
    const sections = [fixedSection('skills', 940), listSection('privacy', textLines(6))];

    const pages = paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 });

    // 30px left after the title: room for the first line only, so the paragraph starts on page 2
    expect(pages).toEqual([
      [{ sectionId: 'skills', includeTitle: true }],
      [{ sectionId: 'privacy', includeTitle: true, items: textLines(6).map((l) => l.id) }],
    ]);
  });

  it('keeps the last two lines together when the paragraph breaks', () => {
    const sections = [fixedSection('skills', 860), listSection('privacy', textLines(6))];

    const pages = paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 });
    const [, firstChunk] = pages[0];
    const [secondChunk] = pages[1];

    // 110px after the title fits 5 lines, but the last line may not be left alone
    expect(firstChunk.items).toHaveLength(4);
    expect(secondChunk.items).toHaveLength(2);
  });

  it('counts the spacing of a split section before the next one', () => {
    const sections = [
      listSection(
        'experience',
        [
          { id: 'a', h: 600 },
          { id: 'b', h: 500 },
        ],
        20
      ),
      fixedSection('skills', 460),
    ];

    const pages = paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 });

    // Page 2: 30 title + 500 item + 20 spacing = 550, so 460 more no longer fits
    expect(pages).toHaveLength(3);
    expect(pages[2]).toEqual([{ sectionId: 'skills', includeTitle: true }]);
  });

  it('places an item taller than a page on its own page without looping', () => {
    const sections = [
      fixedSection('skills', 200),
      listSection('experience', [
        { id: 'huge', h: 1500 },
        { id: 'b', h: 100 },
      ]),
    ];

    expect(paginateSections(sections, { pageHeight: PAGE, firstPageOffset: 0 })).toEqual([
      [{ sectionId: 'skills', includeTitle: true }],
      [{ sectionId: 'experience', includeTitle: true, items: ['huge'] }],
      [{ sectionId: 'experience', includeTitle: true, items: ['b'] }],
    ]);
  });
});

describe('getParagraphFragments', () => {
  const paragraphs = ['Pierwszy akapit ', 'Drugi akapit, dłuższy niż jedna linia'];

  it('joins the lines placed on a page back into paragraph text', () => {
    expect(getParagraphFragments(paragraphs, ['p1:0-6', 'p1:6-14', 'p0'])).toEqual([
      { index: 0, text: 'Pierwszy akapit ' },
      { index: 1, text: 'Drugi akapit, ' },
    ]);
  });

  it('renders the continuation from where the previous page stopped', () => {
    expect(getParagraphFragments(paragraphs, ['p1:14-37'])).toEqual([
      { index: 1, text: 'dłuższy niż jedna linia' },
    ]);
  });

  it('ignores ids of paragraphs that no longer exist', () => {
    expect(getParagraphFragments(paragraphs, ['p5', 'x1'])).toEqual([]);
  });
});
