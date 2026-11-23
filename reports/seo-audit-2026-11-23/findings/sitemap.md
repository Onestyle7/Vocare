# Audyt sitemapy: https://vocare.pl/sitemap.xml

Data audytu: 2026-11-23. Generator: `/Users/bartek/Desktop/Vocare/frontend/app/sitemap.ts`.
Metoda: lokalna kopia `raw/sitemap.xml`, `xmllint`, `curl -L` na wszystkie 141 URL-i (status, redirecty, canonical, meta robots, tytuły), porównanie z linkami wewnętrznymi (/, /blog, /pricing, /assistant).

## Wynik: 88/100

| Kontrola | Wynik |
|---|---|
| Poprawność XML (xmllint) | PASS |
| Namespace, brak duplikatów, 141 URL (limit 50 000 / 50 MB; plik 24 KB) | PASS |
| Wszystkie URL-e 200, 0 redirectów | PASS (141/141) |
| Self-canonical | PASS (141/141; strona główna `https://vocare.pl` vs `/` w sitemapie to ten sam URL) |
| Indeksowalność (brak noindex) | PASS (141/141 `index, follow`) |
| Unikalne tytuły | PASS (0 duplikatów) |
| Spójność trailing slash | PASS (`/blog/` i `/pricing/` dają 308 na wersję bez slasha, canonical bez slasha) |
| Strony auth / dashboard poza sitemapą | PASS |
| `<lastmod>` | WARN (patrz F1, F2) |
| `<changefreq>` / `<priority>` | INFO (patrz F3) |

Skład: 10 tras statycznych, 4 huby kategorii bloga, 127 artykułów. robots.txt wskazuje sitemapę, `Disallow: /api/` jest poprawne.

## Ustalenia

### F1. Brak `<lastmod>` dla 10 tras statycznych — Średni
- Dowód: w XML URL-e `/`, `/assistant`, `/market-analysis`, `/resume-creator`, `/roadmap`, `/pricing`, `/salary-calculator`, `/privacy-policy`, `/terms-of-service`, `/blog` nie mają `lastmod`. Źródło: `sitemap.ts:32-36` (obiekt bez `lastModified`).
- Skutek: Google nie dostaje sygnału świeżości dla stron o najwyższej wartości biznesowej (strona główna, cennik, kalkulator). Regulamin i polityka prywatności mają realne daty zmian, które warto ujawnić (ostatni commit: "postpone Terms of Service version").
- Poprawka: patrz kod poniżej. Daty ustawiać ręcznie, tylko przy istotnej zmianie treści (nie przy każdym deployu, nie `new Date()`).

### F2. Skupione daty `lastmod` w artykułach — Niski
- Dowód: 92 z 127 artykułów ma jedną z 3 dat: 2026-09-22 (44), 2026-09-09 (27), 2026-09-02 (21). Nie są to wszystkie identyczne (więc nie wygląda na wygenerowany `new Date()`), ale to partie zbiorcze. Wg `git log -S` frontmatter `updatedAt: '2026-09-22'` trafił do repo dopiero 2026-10-03, więc to ręcznie wpisywana wartość.
- Ryzyko: jeśli data oznacza przebudowę boilerplate (np. zmianę slugów kategorii 2026-09-22), a nie istotną zmianę treści, Google z czasem przestanie ufać `lastmod`. Jeśli artykuły faktycznie przeredagowano, jest OK.
- Poprawka: ustawiać `updatedAt` tylko po merytorycznej zmianie treści. Nie robić masowej aktualizacji dla zmian technicznych. Format `2026-09-22T00:00:00.000Z` jest poprawny (W3C Datetime).
- Uwaga: 33 pliki `.md` nie mają `updatedAt`, wtedy używane jest `date` (`sitemap.ts:40`), co jest prawidłowym fallbackiem.

### F3. `changefreq` i `priority` w każdym wpisie — Info
- Dowód: po 141 wystąpień obu tagów. Źródło: `sitemap.ts:9-13` (typ), `20-29` (wartości), `34-35`, `41-42`, `57-58`.
- Google ignoruje oba pola; dodatkowo `weekly` dla `/privacy-policy`/`/pricing` i `priority 0.8` dla niemal wszystkiego nie niesie informacji. Bez wpływu na ranking, tylko szum (~35% rozmiaru pliku).
- Poprawka: usunąć (kod poniżej).

### F4. Trasy "aplikacyjne" (/assistant, /market-analysis, /resume-creator, /roadmap) — OK, bez zmian
- Dowód: leżą w grupie `app/(marketing)/` (nie `(app)`), zwracają 200 bez redirectu do logowania, mają `index, follow` i self-canonical, ok. 430-600 słów treści marketingowej oraz własne tytuły. To publiczne landing pages, nie bramki logowania. Właściwe, chronione trasy (`/dashboard`, `/dashboard/profile`) dają 307 do `/sign-in` i poprawnie nie ma ich w sitemapie. `app/(app)/roadmap/[roadmapId]` i `resume/[resumeId]` to trasy prywatne, niewystawione.
- Zalecenie poza sitemapą: te 4 strony nie mają JSON-LD (poza stroną główną i artykułami); rozważyć `SoftwareApplication`/`WebPage`. Ryzyko "thin content" niskie, ale treść ~430 słów jest na dolnej granicy.

### F5. Strony prawne i huby kategorii — OK
- `/privacy-policy`, `/terms-of-service` w sitemapie, 200, indeksowalne. Huby `cv`, `praca`, `kariera`, `rynek-pracy` uwzględnione, puste kategorie pomijane (`sitemap.ts:45-52`), `lastmod` huba = najnowszy artykuł (poprawna logika). Stare slugi `/blog/CV/...` są 308 w `proxy.ts`, nie w sitemapie.

### F6. Publiczne strony brakujące w sitemapie — Brak istotnych
- Linki wewnętrzne na /, /blog, /pricing, /assistant wskazujące poza sitemapę: `/dashboard`, `/dashboard/profile` (307 do logowania), `/sign-in`, `/sign-up` (`noindex, nofollow`), `/preferences` (`noindex, follow`). Wszystkie słusznie wykluczone.
- `/about`, `/contact`, `/faq`, `/cookies` zwracają 404 (nie istnieją). Nie jest to błąd sitemapy, ale brak strony o firmie/kontaktu to luka E-E-A-T i zaufania (YMYL-adjacent: CV, prawo pracy, wynagrodzenia). Do rozważenia jako osobne zadanie contentowe, po utworzeniu dodać do `appRoutes`.
- Blog nie ma paginacji (brak `?page=`), więc nie ma URL-i do dodania.

### F7. Sitemap images — Niski (szansa)
- 127 artykułów ma `coverImage` w frontmatterze (35 plików w `public/images/blog`). Sitemapa obrazów nie jest wymagana, a Google zmniejszył jej znaczenie, ale Next.js 16 wspiera pole `images` w `MetadataRoute.Sitemap`, więc koszt to ~3 linie. Zysk: lepsza odkrywalność obrazów w Google Images. Priorytet niski, po F1/F3. Obraz musi być absolutnym URL (jest `toAbsoluteUrl` w `blogUtils.ts:10`).

### F8. Sitemap index — Nie potrzebny
- 141 URL i 24 KB wobec limitów 50 000 / 50 MB. Index byłby zbędną komplikacją. Wrócić do tematu przy ~5 000+ URL lub gdy powstanie osobna sekcja programatycznych stron. Opcjonalnie `generateSitemaps()` do podziału raportowania w GSC (strony / blog) — nie wymagane.

### F9. Quality gates stron lokalizacyjnych — nie dotyczy
- Brak stron lokalizacyjnych (0 wobec progu ostrzeżenia 30). Artykuły min. ~920 słów, bez wzorca "podmieniane miasto".

## Proponowana zmiana `frontend/app/sitemap.ts`

Usunąć `changeFrequency`/`priority`, dodać ręczne daty dla tras statycznych, opcjonalnie obrazy. Zamiast linii 9-36 i 38-43, 54-59:

```ts
type RouteConfig = {
  path: string;
  /** Ręcznie: data ISTOTNEJ zmiany treści. Nie wstawiać new Date(). */
  lastModified: string;
};

const appRoutes: RouteConfig[] = [
  { path: '/', lastModified: '2026-11-10' },
  { path: '/assistant', lastModified: '2026-11-10' },
  { path: '/market-analysis', lastModified: '2026-11-10' },
  { path: '/resume-creator', lastModified: '2026-11-10' },
  { path: '/roadmap', lastModified: '2026-11-10' },
  { path: '/pricing', lastModified: '2026-11-10' },
  { path: '/salary-calculator', lastModified: '2026-11-10' },
  { path: '/privacy-policy', lastModified: '<data ostatniej zmiany treści>' },
  { path: '/terms-of-service', lastModified: '<data wejścia w życie ostatniej wersji>' },
];

const staticRoutes: MetadataRoute.Sitemap = appRoutes.map((route) => ({
  url: `${baseUrl}${route.path}`,
  lastModified: new Date(route.lastModified),
}));

// /blog: lastmod = najnowszy artykuł (jak w hubach kategorii)
const latestArticle = articles
  .map((a) => a.updatedAt ?? a.date)
  .sort((a, b) => b.getTime() - a.getTime())[0];
staticRoutes.push({ url: `${baseUrl}/blog`, lastModified: latestArticle });

const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
  url: `${baseUrl}/blog/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`,
  lastModified: article.updatedAt ?? article.date,
  images: article.coverImage ? [toAbsoluteUrl(article.coverImage)] : undefined, // opcjonalnie (F7)
}));
```
Kategorie (`:54-59`): usunąć `changeFrequency`, `priority`. Daty `2026-11-10` powyżej to wartości zastępcze; wpisać rzeczywistą datę ostatniej merytorycznej zmiany każdej strony (np. z `git log -1 --format=%ad -- <plik page.tsx>`).

Uwaga: `toAbsoluteUrl` z `blogUtils.ts` czyta `process.env.NEXT_PUBLIC_APP_URL`; w sitemapie jest już `baseUrl`, można użyć `${baseUrl}${article.coverImage}`.

## Dane JSON (kategoria Sitemap)

```json
{"category":"Sitemap","score":88,"findings":[
{"id":"SM-1","severity":"medium","title":"Brak lastmod dla 10 tras statycznych","file":"frontend/app/sitemap.ts:32-36"},
{"id":"SM-2","severity":"low","title":"92/127 artykułów ma 3 zbiorcze daty lastmod","file":"frontend/features/blog/articles/*.md"},
{"id":"SM-3","severity":"info","title":"changefreq/priority w 141 wpisach (ignorowane przez Google)","file":"frontend/app/sitemap.ts:9-13,20-29,34-35,41-42,57-58"},
{"id":"SM-4","severity":"low","title":"Brak image sitemap dla coverImage","file":"frontend/app/sitemap.ts:38-43"},
{"id":"SM-5","severity":"info","title":"Brak /about i /contact (404) - luka E-E-A-T, nie błąd sitemapy"}
],"passed":["xml-valid","141/141 status 200","self-canonical","no noindex","no duplicates","trailing-slash consistent","auth routes excluded","no sitemap index needed"]}
```
