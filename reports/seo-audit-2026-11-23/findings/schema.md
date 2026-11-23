# Audyt Schema.org / danych strukturalnych - vocare.pl

Data: 2026-11-23. Metoda: pobranie HTML (curl) 9 URL-i + analiza kodu w /Users/bartek/Desktop/Vocare/frontend. Wszystkie bloki JSON-LD to server-side (obecne w surowym HTML), format JSON-LD, brak Microdata/RDFa.

## Wynik: 58/100

## Wykryte schema (per URL)

| URL | Bloki JSON-LD | Typy |
|---|---|---|
| / | 2 | Organization (+ImageObject), WebSite |
| /pricing | 0 | - |
| /salary-calculator | 0 | - |
| /resume-creator | 0 | - |
| /blog | 0 | - |
| /blog/cv | 2 | BreadcrumbList, CollectionPage (+Blog, ItemList 35) |
| /blog/cv/jak-zrobic-cv | 2 | BlogPosting, BreadcrumbList |
| /blog/rynek-pracy/najlepiej-platne-zawody | 2 | BlogPosting, BreadcrumbList |
| /blog/praca/jak-znalezc-prace | 2 | BlogPosting, BreadcrumbList |

FAQPage: nie wykryto nigdzie (sekcja FAQ na /pricing jest tylko w HTML, bez znacznika). HowTo: brak.

## Miejsca emisji w kodzie
- `frontend/app/(marketing)/page.tsx:31` i `:35` - Organization i WebSite; buildery w `frontend/features/marketing/utils/structuredData.ts` (Organization: linie 10-25, WebSite: 28-36).
- `frontend/app/blog/[category]/[slug]/page.tsx:214` (BlogPosting, obiekt `jsonLd` zbudowany ok. l. 152-190) i `:218` (BreadcrumbList).
- `frontend/app/blog/[category]/page.tsx:122` (BreadcrumbList) i `:126` (CollectionPage).
- Stałe: `frontend/features/marketing/constants/seo.ts` (SITE_NAME, SITE_LOGO 512x512, SOCIAL_PROFILE_URLS).
- Brak jakiegokolwiek JSON-LD w: `frontend/app/pricing/page.tsx`, `frontend/app/(marketing)/salary-calculator/page.tsx`, `frontend/app/(marketing)/resume-creator/page.tsx`, `frontend/app/blog/page.tsx`.

## Walidacja bloków
- Organization: PASS (name, url, logo 512x512 absolutny, sameAs x4, email). Braki rekomendowane: @id, contactPoint, description.
- WebSite: PASS formalnie (name, alternateName, url, inLanguage). Brak @id i publisher. SearchAction celowo NIE rekomendowany: Google wycofał sitelinks search box (2024), a serwis nie ma wyszukiwarki w serwisie.
- BlogPosting x3: PASS (headline, description, image[], datePublished, dateModified ISO 8601, mainEntityOfPage, publisher+logo, inLanguage). Uwagi poniżej.
- BreadcrumbList x4: PASS (absolutne URL, pozycje 1..n). Ostatnia pozycja ma item - ok.
- CollectionPage: PASS; isPartOf Blog bez @id i bez wskazania na stronę /blog.
- Wszystkie: @context https://schema.org, URL absolutne, brak placeholderów.

## Co działa dobrze
- Poprawnie renderowane po stronie serwera, JSON-LD w surowym HTML.
- Kompletne BlogPosting z dateModified różnym od datePublished, image jako tablica, publisher.logo spełnia wymogi Google (>=112x112).
- Świadoma decyzja o author=Organization zamiast fikcyjnego Person (komentarz w kodzie, slug/page.tsx ok. l. 165-172) - uczciwe, zgodne z E-E-A-T.
- Breadcrumby na wszystkich stronach artykułów i kategorii, zgodne z widoczną nawigacją.
- Canonicale spójne z URL w schema; sitemap ma 141 URL-i.
- Brak przestarzałych typów (HowTo, SpecialAnnouncement) i brak FAQPage.

## Znaleziska

### [High] S1. Brak schema produktu/aplikacji na /pricing, /resume-creator, /salary-calculator
Evidence: 0 bloków JSON-LD w HTML tych 3 stron; w kodzie brak `ld+json` w odpowiadających page.tsx. /pricing zawiera jawne dane cenowe: Free 0 zł, Premium 29 zł/mies. (14 dni próby), pakiet 500 tokenów 19 zł jednorazowo.
Wpływ: brak encji SoftwareApplication/WebApplication z offers - słabsze zrozumienie produktu przez wyszukiwarki i AI; brak szansy na rich result "software app" (wymaga też aggregateRating/review - NIE dodawać wymyślonych ocen).
Fix: patrz snippety A, B, C.

### [Medium] S2. Brak @id i powiązań między encjami (graf)
Evidence: Organization, WebSite i publisher w BlogPosting to osobne, niepołączone obiekty; publisher/author w artykule powtarzają Organization bez @id (slug/page.tsx ok. l. 165-185); WebSite bez publisher.
Fix: nadać Organization `@id: https://vocare.pl/#organization`, WebSite `https://vocare.pl/#website`, i odwoływać się przez `{ "@id": ... }` w publisher/author/isPartOf. Snippet D.

### [Medium] S3. Strona /blog (indeks) bez JSON-LD
Evidence: 0 bloków w /blog (709 KB HTML), `frontend/app/blog/page.tsx` bez skryptu; kategorie mają CollectionPage z isPartOf Blog, ale encja Blog nie jest zdefiniowana nigdzie z @id.
Fix: dodać Blog + BreadcrumbList (snippet E) i podpiąć @id w CollectionPage.isPartOf.

### [Medium] S4. Organization niekompletna (contactPoint, description, @id)
Evidence: structuredData.ts l. 10-25: tylko name, url, logo, email, sameAs. Brak contactPoint, description. Uwaga: komentarz w kodzie wyklucza legalName (działalność nierejestrowana) - zgodnie z tym nie dodawać legalName/taxID.
Fix: snippet D.

### [Medium] S5. Brak BreadcrumbList na stronach marketingowych (/pricing, /salary-calculator, /resume-creator)
Evidence: brak bloków. Priorytet niższy, bo to strony 1. poziomu; wartość głównie w spójności grafu. Opcjonalne.

### [Low] S6. BlogPosting: author = Organization bez Person i bez wordCount/inLanguage-spójności
Evidence: `"author":{"@type":"Organization","name":"Vocare"}` we wszystkich 3 artykułach; widoczne "Autor: Vocare". Dla treści YMYL-adjacent (zarobki, prawo pracy - np. najlepiej-platne-zawody) nazwany autor/recenzent zwiększa E-E-A-T. Nie wymuszać fikcyjnych osób; gdy pojawi się realny autor - przejść na Person z url i sameAs (LinkedIn).
Dodatkowo: `articleSection`, `keywords` ok; można dodać `isPartOf` (Blog @id), `wordCount`, `about`. Opcjonalne.

### [Low] S7. Daty bez strefy lokalnej
Evidence: `"datePublished":"2026-04-15T00:00:00.000Z"` - poprawny ISO 8601 (UTC); dla polskiej publikacji realnie to 02:00 CEST, ale nie jest błędem. Info.

### [Info] S8. Literówka w opisie artykułu (nie schema, ale trafia do `description` w JSON-LD)
Evidence: najlepiej-platne-zawody: "z mediananami zarobków" (powinno być "medianami"). Poprawić w frontmatter artykułu.

### [Info] S9. FAQPage
Brak istniejącego FAQPage - nic do flagowania. Sekcja FAQ na /pricing (komponent PricingFaq) pozostaje bez znacznika; nie dodawać FAQPage pod SERP (rich results wycofane 7.05.2026). Jeśli kiedyś znacznik ma służyć wyłącznie GEO - korzyść niepotwierdzona.

## Snippety do wklejenia (TS)

### D. Organization + WebSite z @id (zamiast obecnych buildOrganizationJsonLd/buildWebSiteJsonLd)
```ts
export const ORG_ID = 'https://vocare.pl/#organization';
export const WEBSITE_ID = 'https://vocare.pl/#website';

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
    description:
      'Vocare to polska platforma AI do rozwoju kariery: doradca zawodowy, analiza rynku pracy, kreator CV z audytem ATS i dopasowane oferty pracy.',
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(SITE_LOGO.path),
      width: SITE_LOGO.width,
      height: SITE_LOGO.height,
    },
    email: SERVICE_PROVIDER.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SERVICE_PROVIDER.email,
      availableLanguage: ['pl'],
    },
    sameAs: [...SOCIAL_PROFILE_URLS],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    alternateName: 'vocare.pl',
    url: toAbsoluteUrl('/'),
    inLanguage: 'pl-PL',
    publisher: { '@id': ORG_ID },
  };
}
```
W BlogPosting: `author: { '@id': ORG_ID }` (lub zostawić obecny obiekt + dodać `'@id': ORG_ID`), `publisher: { '@id': ORG_ID }`, `isPartOf: { '@id': 'https://vocare.pl/blog#blog' }`, `author.name` nadal "Vocare".

### A. /pricing - SoftwareApplication z ofertami (Free, Premium, pakiet 500 tokenów)
```ts
export function buildPricingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://vocare.pl/#app',
    name: 'Vocare',
    url: 'https://vocare.pl/pricing',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'pl-PL',
    description: 'AI doradca kariery, kreator CV z audytem ATS, analiza rynku pracy i roadmapy kariery.',
    publisher: { '@id': 'https://vocare.pl/#organization' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'PLN',
        url: 'https://vocare.pl/pricing',
        availability: 'https://schema.org/InStock',
        description: 'Kreator CV, do 3 CV na koncie, nielimitowana edycja i pobieranie PDF.',
      },
      {
        '@type': 'Offer',
        name: 'Premium (14 dni za 0 zł, potem 29 zł/miesiąc)',
        price: '29',
        priceCurrency: 'PLN',
        url: 'https://vocare.pl/pricing',
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'PLN',
          billingDuration: 'P1M',
          unitCode: 'MON',
        },
      },
      {
        '@type': 'Offer',
        name: 'Pakiet 500 tokenów',
        price: '19',
        priceCurrency: 'PLN',
        url: 'https://vocare.pl/pricing',
        availability: 'https://schema.org/InStock',
        description: 'Płatność jednorazowa, tokeny nie wygasają.',
      },
    ],
  };
}
```
Nie dodawać aggregateRating/review bez realnych, widocznych na stronie opinii (TrustScore na homepage - sprawdzić, czy to prawdziwe, weryfikowalne oceny, zanim zostaną oznaczone).

### B. /resume-creator - WebApplication
```ts
{
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://vocare.pl/resume-creator#app',
  name: 'Kreator CV Vocare',
  url: 'https://vocare.pl/resume-creator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'pl-PL',
  description: 'Kreator CV z AI i audytem ATS: edycja, pobieranie PDF, dopasowanie CV do ofert pracy.',
  isPartOf: { '@id': 'https://vocare.pl/#app' },
  publisher: { '@id': 'https://vocare.pl/#organization' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN', availability: 'https://schema.org/InStock' },
}
```

### C. /salary-calculator - WebApplication
```ts
{
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://vocare.pl/salary-calculator#app',
  name: 'Kalkulator wynagrodzeń brutto netto 2026',
  url: 'https://vocare.pl/salary-calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  inLanguage: 'pl-PL',
  description: 'Porównaj wynagrodzenie netto na umowie o pracę, zleceniu, o dzieło i B2B (ryczałt, liniowy, skala): składki ZUS, zdrowotna, PIT i koszt pracodawcy.',
  isAccessibleForFree: true,
  publisher: { '@id': 'https://vocare.pl/#organization' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN', availability: 'https://schema.org/InStock' },
}
```
Dodatkowo dla każdej z 3 stron: BreadcrumbList (Strona główna > Nazwa) - opcjonalnie.

### E. /blog - Blog + BreadcrumbList
```ts
{
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': 'https://vocare.pl/blog#blog',
  name: 'Blog Vocare',
  url: 'https://vocare.pl/blog',
  inLanguage: 'pl-PL',
  description: 'Poradniki o CV, rynku pracy i szukaniu pracy.',
  publisher: { '@id': 'https://vocare.pl/#organization' },
  isPartOf: { '@id': 'https://vocare.pl/#website' },
}
```
oraz w CollectionPage (`blog/[category]/page.tsx` ok. l. 100-105) zamienić `isPartOf: { '@type': 'Blog', name, url }` na `isPartOf: { '@id': 'https://vocare.pl/blog#blog' }`.

## Podsumowanie punktacji
- Pokrycie typów: 20/30 (artykuły i breadcrumby dobre; brak aplikacji/ofert, brak /blog).
- Poprawność i kompletność: 22/25.
- Powiązania @id / graf: 4/15.
- Organization/E-E-A-T: 8/15.
- Zgodność z regułami (brak deprecated): 5/5 bonus -> łącznie ok. 58/100 po zaokrągleniu wag.
