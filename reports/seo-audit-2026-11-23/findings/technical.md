# Audyt Technical SEO — vocare.pl (stan na 2026-11-23)

**Wynik Technical SEO: 84/100**

| Kategoria | Status | Uwagi |
|---|---|---|
| Crawlability | PASS | robots.txt poprawny, sitemap zwalidowana (helper: valid, kind=urlset), 141/141 URL = 200 |
| Indexability | PASS | 141/141 `index, follow`, canonical self-referencing, brak duplikatów title/description |
| Security | PARTIAL | HSTS jest, CSP tylko Report-Only, brak Permissions-Policy, wycieka X-Powered-By |
| URL / redirecty | PASS | www->apex 301, http->https 308, trailing slash 308, legacy kategorie bloga 308 |
| Mobile | PASS | viewport w 141/141, lang="pl" |
| Core Web Vitals (źródło) | PARTIAL | Hero z fetchPriority=high, fonty swap; ale /blog = 709 KB HTML (49 KB br) |
| Structured data | PARTIAL | Blog OK (BlogPosting+BreadcrumbList); strony produktowe bez JSON-LD |
| JS rendering | PASS | SSR/SSG (x-nextjs-prerender: 1), 430-6500 słów w surowym HTML, 1x H1 na stronę |
| IndexNow | FAIL (Info) | brak implementacji |

## Co działa dobrze
- Wszystkie 141 URL z sitemapy zwracają 200 bez przekierowań, żaden nie ma noindex (sprawdzone curlem + parsowaniem HTML).
- Canonical = og:url = adres w sitemapie na 140/141 URL (jedyny wyjątek: strona główna, patrz F-05). Query params (`/blog?page=2`, `/pricing?utm_source=x`) kanonikalizują się do czystego URL.
- Redirecty: `http://vocare.pl` -> 308 -> `https://vocare.pl/`; `https://www.vocare.pl` -> 301 -> apex; `/pricing/` -> 308 -> `/pricing`; `/blog/CV/jak-zrobic-cv` -> 308 -> małe litery (proxy.ts:48-72); stare scalone posty mają 301 w next.config.ts.
- Prawdziwy 404: nieistniejące URL zwracają HTTP 404 (nie soft 404), strona 404 ma `noindex`.
- Strony auth (`/sign-in`, `/sign-up`, `/forgot-password`), `/maintenance`, `/preferences` oraz archiwalne wersje regulaminu mają `noindex`.
- Pozornie „auth-gated" trasy z sitemapy (`/assistant`, `/market-analysis`, `/resume-creator`, `/roadmap`) to publiczne landingi marketingowe: 200, SSR, 430-600 słów, H1, własny title/description/canonical. Przekierowanie na /sign-in dotyczy tylko `/dashboard` oraz `/resume/*`, `/roadmap/*` (proxy.ts:112-114), których nie ma w sitemapie.
- Kompresja brotli, TTFB ~190 ms (cache Vercel HIT), `x-content-type-options`, `x-frame-options`, `referrer-policy` obecne.
- JSON-LD na wszystkich 132 artykułach/kategoriach (BlogPosting z datePublished/dateModified, BreadcrumbList), `article:*` meta.
- Wszystkie obrazy mają alt, `next/image` z lazy-loadingiem; LCP image na home ma `fetchPriority="high"` + preload.
- Sitemap: `<lastmod>` na 131 wpisach z artykułów i kategorii; poprawny XML, `Content-Type: application/xml`.

## Problemy (priorytetyzowane)

### Medium

**F-01 [Medium] Brak danych strukturalnych na stronach produktowych/komercyjnych**
- Dowód: JSON-LD = 0 na `/pricing`, `/resume-creator`, `/assistant`, `/market-analysis`, `/roadmap`, `/salary-calculator`, `/blog`. Tylko home ma Organization + WebSite + ImageObject.
- Fix: dodać `SoftwareApplication`/`WebApplication` (+ `Offer` z cenami) na `/pricing` i stronach funkcji, `FAQPage` tam, gdzie jest sekcja FAQ, `WebApplication` na `/salary-calculator`, `CollectionPage`/`ItemList` na `/blog`. Dodać `BreadcrumbList` także na stronach marketingowych. Szczegóły: raport schema.md.

**F-02 [Medium] Strona `/blog` ładuje wszystkie ~125 artykułów w jednym dokumencie (709 KB HTML, 49 KB br, 6555 słów)**
- Dowód: `/blog` i `/blog?page=2` zwracają identyczne 709 481 B; brak paginacji (`rel=next`), komponent `SearchView` dostaje całą listę (app/blog/page.tsx:5, 7).
- Ryzyko: większy parse/hydratacja -> gorsze INP/LCP na liście; rozwodnienie tematyczne hubu.
- Fix: przekazywać do klienta tylko pola potrzebne do kafelków (tytuł, slug, kategoria, 1 obrazek, krótki opis), stronicować (np. 12-24 na stronę z kanonikalem self-referencing na `?page=N` albo load-more po stronie klienta), a pełną listę linków zostawić na stronach kategorii.

**F-03 [Medium] Content-Security-Policy tylko w trybie Report-Only**
- Dowód: nagłówek `content-security-policy-report-only` (next.config.ts:15-34, :41-46); brak egzekwowanego CSP. Dodatkowo `script-src 'unsafe-inline'`.
- Fix: po przeglądzie raportów przejść na `Content-Security-Policy`; docelowo nonce/hash zamiast `'unsafe-inline'` (Next.js wspiera nonce przez proxy).

### Low

**F-04 [Low] HSTS bez `includeSubDomains` i `preload`**
- Dowód: `strict-transport-security: max-age=63072000` (ustawia Vercel). Brak własnego nagłówka w next.config.ts:41-46.
- Fix: dodać `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` w `securityHeaders`, o ile wszystkie subdomeny działają na HTTPS; potem zgłosić do hstspreload.org.

**F-05 [Low] Niespójność trailing slash dla strony głównej**
- Dowód: sitemap `https://vocare.pl/` (app/sitemap.ts:21-22, path `/`) vs canonical i og:url `https://vocare.pl` (features/marketing/utils/metadata.ts:31, 36; app/layout.tsx:109). Technicznie to ten sam URL, ale lepiej ujednolicić.
- Fix: w sitemap.ts mapować `/` na `baseUrl` bez końcowego slasha (lub odwrotnie we wszystkich miejscach).

**F-06 [Low] Nagłówek `X-Powered-By: Next.js` ujawniony**
- Dowód: nagłówek odpowiedzi na `/`. Fix: `poweredByHeader: false` w next.config.ts (brak w pliku, `nextConfig` zaczyna się od linii ~50).

**F-07 [Low] Brak nagłówków Permissions-Policy / COOP oraz `security.txt`**
- Dowód: brak w odpowiedzi; `/.well-known/security.txt` = 404.
- Fix: dodać `Permissions-Policy: camera=(), microphone=(), geolocation=()` do `securityHeaders`; opcjonalnie security.txt.

**F-08 [Low] 55 tytułów artykułów ma 66-70 znaków (z sufiksem „| Vocare")**
- Dowód: np. `/blog/cv/darmowy-kreator-cv` (70), `/blog/praca/jak-znalezc-prace` (70), `/blog/cv/kreator-cv` (69). Google obcina przy ~600 px (~60 znaków).
- Fix: skrócić `title` w frontmatterze do <=55 znaków przed sufiksem albo ustawić `absolute` bez sufiksu dla długich.
- Dodatkowo `/salary-calculator`: description 170 znaków (limit ~160).

**F-09 [Low] Strona 404 ma dwa sprzeczne znaczniki robots**
- Dowód: HTML 404 zawiera `<meta name="robots" content="noindex">` (z Next) i `<meta name="robots" content="index, follow">` (z layoutu, app/layout.tsx:105-113). Googlebot stosuje restrykcyjniejszą wartość, więc działa, ale to szum. Tytuł 404 to samo „Vocare".
- Fix: w `app/not-found.tsx` (komponent `'use client'`, więc metadata nie może tam być) wyeksportować metadata z `robots: {index:false}` z segmentu serwerowego albo dodać nadrzędny layout; nadać tytuł „Nie znaleziono strony | Vocare".

**F-10 [Low] Archiwalne wersje regulaminu: `noindex` + canonical do innej strony**
- Dowód: `/terms-of-service/2025-12-22`, `/terms-of-service/2026-10-13` mają `noindex, follow` i `canonical -> /terms-of-service` (app/(marketing)/terms-of-service/2025-12-22/page.tsx:14-16). Sprzeczne sygnały (noindex wygrywa, canonical jest ignorowany).
- Fix: usunąć `alternates.canonical` z archiwów (zostawić samo noindex) albo odwrotnie.

**F-11 [Low] Łańcuch redirectów `http://www.vocare.pl`**
- Dowód: `http://www` -> 308 -> `https://www` -> 301 -> `https://vocare.pl/` (2 skoki). Fix: w Vercel ustawić redirect www->apex bez pośredniego kroku (domena apex jako primary, www jako redirect 308 na apex) — Vercel zwykle skraca to sam po ustawieniu primary domain.

**F-12 [Low] Brak `<link rel="manifest">` i apple-touch-icon**
- Dowód: `/site.webmanifest` istnieje (200, w /public), ale w `<head>` nie ma linku do niego; `/manifest.webmanifest` = 404; brak `apple-touch-icon`. Manifest ma angielski opis.
- Fix: `app/manifest.ts` lub `metadata.manifest = '/site.webmanifest'` w app/layout.tsx, `icons.apple` w metadata; opis po polsku.

**F-13 [Low] Strony statyczne w sitemapie bez `<lastmod>`**
- Dowód: 10 wpisów (home, 4 landingi, pricing, kalkulator, privacy, terms, /blog) bez lastmod (app/sitemap.ts:36-40). `changefreq`/`priority` są ignorowane przez Google.
- Fix: dodać `lastModified` (data wdrożenia/zmiany treści); dla /blog użyć najnowszego `updatedAt ?? date` artykułu.

### Info

**F-14 [Info] IndexNow niezaimplementowane**
- Dowód: brak pliku klucza i wywołań w repo. Nie wpływa na Google, ale Bing/Yandex/Naver wykorzystują do szybszego indeksowania.
- Fix: wygenerować klucz, hostować `/<key>.txt`, wywoływać `https://api.indexnow.org/indexnow` po publikacji/aktualizacji artykułu (np. w hooku CI po deployu na podstawie zmienionych slugów).

**F-15 [Info] Brak `/llms.txt` (404)** — opcjonalne, patrz raport agentic.md/geo.md.

**F-16 [Info] robots.txt: dyrektywa `Host:` jest ignorowana przez Google i Bing** (Yandex ją porzucił). Nieszkodliwa; można usunąć w app/robots.ts:14. Rozważyć też jawne reguły dla crawlerów AI (patrz geo.md) — obecnie `User-agent: *` zezwala wszystkim.

**F-17 [Info] Cache-Control `public, max-age=0, must-revalidate`** na HTML — standard Vercel dla statycznych stron z walidacją ETag; prerender z cache (`age` ~3,8 dnia, `x-vercel-cache: HIT`). Bez zmian; dla treści blogowych rozważyć `s-maxage` + `stale-while-revalidate` tylko jeśli potrzebne.

## Sprawdzenia bez zastrzeżeń
- Brak hreflang — OK dla serwisu jednojęzycznego (pl); `lang="pl"` we wszystkich 141 stronach, `og:locale=pl_PL`.
- Brak noindex na żadnym URL z sitemapy; brak URL z sitemapy zablokowanych w robots.txt.
- Soft 404: brak (`/nie-istnieje-xyz`, `/blog/cv/nie-istnieje`, `/blog/nie-istnieje` -> 404).
- Duplikaty title/description: 0 spośród 141.

## Dane strukturalne (JSON-compatible)
```json
{
  "category": "Technical SEO",
  "score": 84,
  "findings": [
    {"id":"F-01","severity":"Medium","title":"Brak JSON-LD na stronach produktowych","fix":"SoftwareApplication/Offer/FAQPage/BreadcrumbList"},
    {"id":"F-02","severity":"Medium","title":"/blog 709 KB HTML, brak paginacji","fix":"Stronicowanie i odchudzenie propsów SearchView"},
    {"id":"F-03","severity":"Medium","title":"CSP tylko Report-Only","fix":"Wymusić CSP, nonce zamiast unsafe-inline"},
    {"id":"F-04","severity":"Low","title":"HSTS bez includeSubDomains/preload"},
    {"id":"F-05","severity":"Low","title":"Home: sitemap '/' vs canonical bez slasha"},
    {"id":"F-06","severity":"Low","title":"X-Powered-By ujawniony"},
    {"id":"F-07","severity":"Low","title":"Brak Permissions-Policy"},
    {"id":"F-08","severity":"Low","title":"55 tytułów > 65 znaków"},
    {"id":"F-09","severity":"Low","title":"404: sprzeczne meta robots"},
    {"id":"F-10","severity":"Low","title":"Archiwa regulaminu: noindex + canonical"},
    {"id":"F-11","severity":"Low","title":"http://www -> 2 redirecty"},
    {"id":"F-12","severity":"Low","title":"Brak linku do manifestu i apple-touch-icon"},
    {"id":"F-13","severity":"Low","title":"10 wpisów sitemap bez lastmod"},
    {"id":"F-14","severity":"Info","title":"IndexNow niezaimplementowane"},
    {"id":"F-15","severity":"Info","title":"Brak llms.txt"},
    {"id":"F-16","severity":"Info","title":"Host: w robots.txt ignorowany"}
  ]
}
```
