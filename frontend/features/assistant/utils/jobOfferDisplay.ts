import { JobOfferSource, SalaryPeriod, ScoredJobOffer } from '@/lib/types/jobOffers';

const REMOTE_LOCATION = 'remote';

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
