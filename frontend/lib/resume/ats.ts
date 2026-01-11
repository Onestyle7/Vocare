export type SectionType = 'summary' | 'experience' | 'education' | 'languages' | 'custom';

export type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  email: string;
};

export type SummarySection = {
  id: string;
  type: 'summary';
  title: string;
  content: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ExperienceSection = {
  id: string;
  type: 'experience';
  title: string;
  items: ExperienceItem[];
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type EducationSection = {
  id: string;
  type: 'education';
  title: string;
  items: EducationItem[];
};

export type LanguageItem = {
  id: string;
  name: string;
  level: string;
};

export type LanguagesSection = {
  id: string;
  type: 'languages';
  title: string;
  items: LanguageItem[];
};

export type CustomSection = {
  id: string;
  type: 'custom';
  title: string;
  content: string;
};

export type Section =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | LanguagesSection
  | CustomSection;

const ALLOWED_TAGS = new Set(['P', 'STRONG', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'BR']);

const cleanNode = (node: Node, doc: Document) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return doc.createTextNode('');
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    const fragment = doc.createDocumentFragment();
    element.childNodes.forEach((child) => {
      fragment.appendChild(cleanNode(child, doc));
    });
    return fragment;
  }

  const next = doc.createElement(tagName.toLowerCase());

  if (tagName === 'A') {
    const href = element.getAttribute('href') ?? '';
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      next.setAttribute('href', href);
      next.setAttribute('target', '_blank');
      next.setAttribute('rel', 'noreferrer');
    }
  }

  element.childNodes.forEach((child) => {
    next.appendChild(cleanNode(child, doc));
  });

  return next;
};

export const sanitizeHtml = (value: string) => {
  if (!value) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'text/html');
  const outputDoc = document.implementation.createHTMLDocument('');
  const fragment = outputDoc.createDocumentFragment();

  doc.body.childNodes.forEach((child) => {
    fragment.appendChild(cleanNode(child, outputDoc));
  });

  const container = outputDoc.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
};

export const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractKeywords = (text: string) => {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 3);

  return Array.from(new Set(tokens));
};

export const calculateMatch = (jobText: string, sections: Section[]) => {
  const jobKeywords = extractKeywords(jobText);
  const resumeText = sections
    .map((section) => {
      if (section.type === 'summary' || section.type === 'custom') {
        return stripHtml(section.content);
      }
      if (section.type === 'experience') {
        return (section as ExperienceSection).items
          .map((item) => `${item.role} ${item.company} ${stripHtml(item.description)}`)
          .join(' ');
      }
      if (section.type === 'education') {
        return (section as EducationSection).items
          .map((item) => `${item.school} ${item.degree} ${stripHtml(item.description)}`)
          .join(' ');
      }
      return (section as LanguagesSection).items.map((item) => `${item.name} ${item.level}`).join(' ');
    })
    .join(' ')
    .toLowerCase();

  const matched = jobKeywords.filter((keyword) => resumeText.includes(keyword));
  const score = jobKeywords.length ? Math.round((matched.length / jobKeywords.length) * 100) : 0;
  const missing = jobKeywords.filter((keyword) => !resumeText.includes(keyword));

  return {
    score,
    matched,
    missing,
  };
};

export const validateResume = (profile: Profile) => {
  const issues: string[] = [];

  if (!profile.firstName || !profile.lastName) {
    issues.push('Brakuje imienia lub nazwiska.');
  }

  if (!profile.phone) {
    issues.push('Brakuje numeru telefonu.');
  }

  if (!profile.city) {
    issues.push('Brakuje miasta.');
  }

  if (!profile.email) {
    issues.push('Brakuje adresu e-mail.');
  }

  return {
    ready: issues.length === 0,
    issues,
  };
};

export const buildResumeHtml = (payload: {
  headerHtml: string;
  pagesHtml: string;
}) => {
  const { headerHtml, pagesHtml } = payload;

  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Poppins', sans-serif; color: #111; background: #fff; }
      .page { width: 210mm; height: 297mm; page-break-after: always; }
      .page-inner { padding: 16mm; }
      h2 { font-size: 16px; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 0.04em; }
      h3 { font-size: 14px; margin: 12px 0 4px; }
      p, li { font-size: 12px; line-height: 1.4; margin: 0 0 6px; }
      ul { padding-left: 16px; margin: 0 0 6px; }
      a { color: inherit; text-decoration: none; }
    </style>
  </head>
  <body>
    ${headerHtml}
    ${pagesHtml}
  </body>
</html>`;
};
