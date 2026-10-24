import { JobOfferSource, SalaryPeriod, ScoredJobOffer } from '@/lib/types/jobOffers';

/**
 * Brief krótszy niż tyle znaków (po usunięciu HTML) nie jest opisem, tylko resztką
 * po formatowaniu - np. "<p><b></b></p>" albo samo jedno zdanie bez treści.
 */
const MIN_BRIEF_LENGTH = 60;

/** SolidJobs zaczyna każdy opis tym samym nagłówkiem - w podglądzie jest zbędny. */
const SOLID_JOBS_DESCRIPTION_HEADER = /^czym będziesz się zajmować\?\s*/i;

const REMOTE_LOCATION = 'remote';

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  oacute: 'ó',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bull: '•',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

const SOURCE_LABELS: Record<JobOfferSource, string> = {
  NofluffJobs: 'No Fluff Jobs',
  SolidJobs: 'SOLID.Jobs',
};

const SALARY_PERIOD_SUFFIXES: Record<SalaryPeriod, string> = {
  Hour: '/h',
  Day: '/dzień',
  Month: '/mies.',
  Year: '/rok',
};

/** Słownik kategorii NoFluffJobs - na niego backend mapuje też kategorie SolidJobs. */
const CATEGORY_LABELS: Record<string, string> = {
  agile: 'Agile',
  architecture: 'Architektura',
  artificialIntelligence: 'AI',
  automation: 'Automatyka',
  backend: 'Backend',
  businessAnalyst: 'Analiza biznesowa',
  businessIntelligence: 'Business Intelligence',
  consulting: 'Doradztwo',
  customerService: 'Obsługa klienta',
  data: 'Data',
  devops: 'DevOps',
  electricalEng: 'Elektrotechnika',
  electronics: 'Elektronika',
  embedded: 'Embedded',
  erp: 'ERP',
  finance: 'Finanse',
  frontend: 'Frontend',
  fullstack: 'Fullstack',
  gameDev: 'Gamedev',
  hr: 'HR',
  law: 'Prawo',
  logistics: 'Logistyka',
  marketing: 'Marketing',
  mechanics: 'Mechanika',
  mobile: 'Mobile',
  officeAdministration: 'Administracja biurowa',
  other: 'Inne',
  productManagement: 'Product management',
  projectManager: 'Project management',
  sales: 'Sprzedaż',
  security: 'Security',
  support: 'Wsparcie IT',
  sysAdministrator: 'Administracja systemami',
  telecommunication: 'Telekomunikacja',
  testing: 'Testowanie',
  ux: 'UX/UI',
};

/** Dekoduje encje HTML bez DOM-u - karta renderuje się też na serwerze. */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1].toLowerCase() === 'x';
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_HTML_ENTITIES[entity] ?? match;
  });
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  const withoutTags = value
    .replace(/<[^>]*>/g, ' ')
    // Tag ucięty w połowie - descriptionPreview jest przycinany na backendzie bez znajomości HTML-a
    .replace(/<[^>]*$/, ' ');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/**
 * Tekst opisu na kartę: sensowny brief, a gdy go brak (SolidJobs nie ma briefu, część briefów
 * NoFluffJobs to puste tagi albo powtórzony tytuł) - początek pełnego opisu.
 * Zwraca null, gdy nie ma czego pokazać.
 */
export function getOfferPreview(
  offer: Pick<ScoredJobOffer, 'title' | 'briefDescription' | 'descriptionPreview'>
): string | null {
  const brief = stripHtml(offer.briefDescription);
  const isBriefSameAsTitle = brief.toLowerCase() === offer.title.trim().toLowerCase();

  if (brief.length >= MIN_BRIEF_LENGTH && !isBriefSameAsTitle) return brief;

  const descriptionPreview = stripHtml(offer.descriptionPreview).replace(
    SOLID_JOBS_DESCRIPTION_HEADER,
    ''
  );
  if (descriptionPreview) return descriptionPreview;

  return brief && !isBriefSameAsTitle ? brief : null;
}

export function getOfferSourceLabel(source?: JobOfferSource | null): string | null {
  if (!source) return null;
  return SOURCE_LABELS[source] ?? null;
}

export function getCategoryLabel(category?: string | null): string {
  if (!category) return '';
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];

  // Nieznana kategoria (np. nowa w słowniku) - "someCategory" -> "Some category"
  const words = category.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Lokalizacje na kartę: pierwsze miasto, liczba pozostałych i informacja o pracy zdalnej,
 * np. "Warszawa +1 · Zdalnie". Zwraca pusty string, gdy oferta nie ma lokalizacji.
 */
export function formatLocations(locations?: string[] | null): string {
  const unique = new Map<string, string>();
  for (const location of locations ?? []) {
    const trimmed = location?.trim();
    const key = trimmed?.toLowerCase();
    // Przy duplikatach zostaje pierwsza pisownia
    if (key && !unique.has(key)) unique.set(key, trimmed);
  }

  const isRemote = unique.delete(REMOTE_LOCATION);
  const cities = [...unique.values()];

  if (cities.length === 0) return isRemote ? 'Zdalnie' : '';

  const citiesLabel = cities.length > 1 ? `${cities[0]} +${cities.length - 1}` : cities[0];
  return isRemote ? `${citiesLabel} · Zdalnie` : citiesLabel;
}

export function formatSalary(
  offer: Pick<ScoredJobOffer, 'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod'>
): string {
  if (offer.salaryMin == null && offer.salaryMax == null) return 'Brak widełek';

  // 'always' - polski format domyślnie nie grupuje liczb 4-cyfrowych, co dawało "8000–13 000"
  const formatter = new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 2,
    useGrouping: 'always',
  });
  const min = offer.salaryMin != null ? formatter.format(offer.salaryMin) : null;
  const max = offer.salaryMax != null ? formatter.format(offer.salaryMax) : null;
  const currency = offer.salaryCurrency ? ` ${offer.salaryCurrency}` : '';
  const period = offer.salaryPeriod ? (SALARY_PERIOD_SUFFIXES[offer.salaryPeriod] ?? '') : '';
  const suffix = `${currency}${period}`;

  if (min && max) return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`;
  if (min) return `od ${min}${suffix}`;
  return `do ${max}${suffix}`;
}
