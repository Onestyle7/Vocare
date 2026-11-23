# vocare.pl — Pełny audyt SEO

**Data:** 2026-11-23 · **URL:** https://vocare.pl · **Typ biznesu:** SaaS (platforma kariery AI) + publisher (blog, 127 artykułów)
**Zakres:** 141 URL z sitemapy, 11 analiz specjalistycznych. Szczegóły i dowody: `findings/*.md`, zrzuty: `screenshots/`. Plan wdrożenia: `ACTION-PLAN.md`.

## SEO Health Score: 70/100

| Kategoria | Waga | Wynik | Wkład |
|---|---|---|---|
| Technical SEO | 22% | 84 | 18,5 |
| Content Quality | 23% | 56 | 12,9 |
| On-Page SEO | 20% | 74 | 14,8 |
| Schema / Structured Data | 10% | 59 | 5,9 |
| Performance (CWV, lab) | 10% | 78 | 7,8 |
| AI Search Readiness | 10% | 60 | 6,0 |
| Images | 5% | 74 | 3,7 |
| **Razem** | | | **69,6 ≈ 70** |

Dodatkowo (poza wagami): SXO Gap — `/resume-creator` 33, `/salary-calculator` 57, `/` 60, `/pricing` 56. Sitemap 88. Backlinki: brak danych (domena nieobecna w grafie Common Crawl Q1 2026). Agent-UX (dostępność dla agentów) 100/100 na `/` i `/pricing`.

**Ograniczenia danych:** brak kluczy Google API / GSC / Moz → brak danych polowych CWV (INP niezmierzony, TBT jako przybliżenie), brak listy backlinków, kanibalizacja oceniana z WebSearch (indeks nie-PL) — potwierdzić w GSC przed wdrożeniem 301.

---

## Executive Summary

Technicznie strona jest zdrowa: wszystkie 141 URL zwraca 200, self-canonical, indeksowalne, SSR/prerender, poprawne redirecty, prawdziwe 404, boty AI nie są blokowane. **Słabości leżą w treści i zaufaniu**, nie w infrastrukturze: anonimowe autorstwo przy tematach YMYL, brak strony „O nas”, szablonowa masowa produkcja części bloga, kanibalizacja w klastrze CV, oraz strona `/resume-creator`, która nie odpowiada intencji „kreator cv” (Google chce działającego narzędzia).

### Top 5 problemów
1. **Fałszywe „bezpłatnie”** — `darmowy-kreator-cv` i `kreator-cv` obiecują darmową analizę AI i dopasowanie CV, `/pricing` je wycenia (10/20 tokenów). *(High — zaufanie, ryzyko prawne)*
2. **CTA „Sprawdź za darmo” → logowanie z „Sesja wygasła”** — `proxy.ts:113` dodaje ten komunikat każdemu niezalogowanemu. Zweryfikowane na produkcji. *(High — konwersja)*
3. **`/resume-creator` to landing, SERP chce edytora** — kreator za logowaniem, 3 URL kanibalizują „kreator cv”. *(High — SXO)*
4. **Brak E-E-A-T dla YMYL** — 127/127 artykułów „Autor: Vocare”, `/about` 404, kolizja nazwy z Vocare UK. *(High)*
5. **LCP mobile 4,7–6,4 s** — elementem LCP jest baner cookies renderowany po hydratacji; 3 blokujące `@import` Google Fonts w `globals.css`. *(High)*

### Top 5 quick wins
1. Przepisać opis/treść `darmowy-kreator-cv` (15 min).
2. CTA → `/sign-up`, `reason` tylko przy faktycznie wygasłej sesji (30 min).
3. `next/font` zamiast `@import` (1 h).
4. `poweredByHeader: false`, HSTS preload, ujednolicony URL strony głównej i LinkedIn, literówka „mediananami” (30 min).
5. JSON-LD `SoftwareApplication`/`WebApplication` na `/pricing`, `/resume-creator`, `/salary-calculator` — snippety gotowe w `findings/schema.md` (1–2 h).

---

## Technical SEO — 84/100
**Działa:** 141/141 URL 200, bez noindex, unikalne title/description, 1×H1, `lang="pl"`; redirecty http→https (308), www→apex (301), trailing slash (308), lowercase (308); prawdziwe 404; prerender (`x-nextjs-prerender: 1`), brotli, TTFB ~50–190 ms; trasy prywatne (`/dashboard/*`) poprawnie za 307, auth-pages z noindex; landingi `/assistant`, `/market-analysis`, `/roadmap`, `/resume-creator` publiczne i indeksowalne.

| # | Problem | Waga | Fix |
|---|---|---|---|
| T1 | `/blog` = 709 KB HTML, 6 555 słów, brak paginacji, `?page=2` = ten sam dokument (`app/blog/page.tsx:5,7`) | Medium | Paginacja SSR, tylko pola kafelków do klienta |
| T2 | CSP tylko Report-Only z `'unsafe-inline'` (`next.config.ts:15-46`) | Medium | Wymusić CSP z nonce |
| T3 | Brak JSON-LD poza home/blogiem | Medium | patrz Schema |
| T4 | HSTS bez `includeSubDomains`/`preload`; `X-Powered-By`; brak `Permissions-Policy`, `security.txt` | Low | `next.config.ts` |
| T5 | Sitemap `https://vocare.pl/` vs canonical `https://vocare.pl` (`app/sitemap.ts:36`, `features/marketing/utils/metadata.ts:31,36`) | Low | Ujednolicić |
| T6 | 404 ma jednocześnie `noindex` i `index, follow` (`app/layout.tsx:105`, `not-found.tsx` jest `'use client'`) | Low | Server wrapper z metadata |
| T7 | Archiwa regulaminu: `noindex` + canonical do bieżącej wersji | Low | Wybrać jeden sygnał |
| T8 | `http://www` → 2 skoki; brak `<link rel="manifest">`; 10 wpisów sitemap bez `lastmod` | Low | — |
| T9 | Brak IndexNow; dyrektywa `Host:` w robots ignorowana | Info | — |

## Content Quality — 56/100 · On-Page — 74/100
E-E-A-T 43/100 (Experience 30, Expertise 45, Authoritativeness 35, Trust 55); AI citation readiness 70.

**Działa:** artykuły finansowe (`ile-na-reke-b2b`, `brutto-netto-umowa-zlecenie`, `umowa-o-prace-vs-b2b`) wzorcowe — odpowiedź w 1. zdaniu, własne tabele, źródła gov.pl/zus.pl, stawki ZUS 2026 poprawne; „Najważniejsze wnioski” w 125/127, FAQ 127/127, tabele w 100; każdy artykuł linkuje do produktu; metadata nie jest szablonowa (site_risk low).

| # | Problem | Waga |
|---|---|---|
| C1 | „Bezpłatnie” sprzeczne z cennikiem (`darmowy-kreator-cv.md:3`, `kreator-cv.md`) | High |
| C2 | Brak autorów-osób i recenzentów przy YMYL; `/about`, `/blog/autor` 404 | High |
| C3 | `najlepiej-platne-zawody` (top strona w GSC): „mediana” jako przedział, szacunki bez źródeł | High |
| C4 | 60/127 artykułów < 800 słów; 15/26 prawno-finansowych cienkie, 9 bez źródła urzędowego | High |
| C5 | Ślady masowej produkcji: szablonowy akapit w 6 artykułach `rynek-pracy-*`, 92 daty `updatedAt` na 3 dniach (zmiany kosmetyczne), identyczny szkielet 125/127 | High |
| C6 | 22 artykuły z procentami bez źródła; nieweryfikowalne liczby na home („99% dopasowania”, „100% odporne na ATS”) | Medium |
| C7 | Ranking `kreator-cv` stawia Vocare na 1. miejscu bez ujawnienia i kryteriów | Medium |
| C8 | CTA per kategoria — „Zrób CV za darmo” w artykułach o mobbingu/L4 (`features/marketing/constants/promo.ts`) | Medium |
| C9 | On-page: H1 bez fraz na `/blog`, `/pricing`, `/assistant`; losowe wielkie litery („Swoją Karierę”); 99/127 tytułów > 60 znaków; 0 obrazów w treści artykułów | Medium |
| C10 | Monotonne meta description (116/127 „Sprawdź”, 120/127 pytanie) | Low |

### Architektura treści (klastry)
Huby: rynek-pracy 23/26 artykułów linkuje do filara, kariera 14/26, **praca 8/37**, **cv 9/34**. Kanibalizacja: list motywacyjny ×2, doradca/doradztwo, kreator CV ×3 (z `/resume-creator`), rdzeń CV (cv / jak-zrobic-cv / cv-do-pracy / profesjonalne-cv). `/salary-calculator` linkowany z treści tylko 2 artykułów. Szczegóły i macierz SERP: `findings/cluster.md`.

## Schema — 59/100
**Działa:** `BlogPosting` kompletny (daty ISO, image, publisher z logo), `BreadcrumbList`, `CollectionPage` na hubach, `Organization` z logo i 4×`sameAs`, brak przestarzałych typów.
**Braki:** brak JSON-LD na `/pricing`, `/resume-creator`, `/salary-calculator`, `/blog` (High); brak `@id` i powiązań encji (Medium); Organization bez `description`/`contactPoint`/`@id` (Medium); autor = Organization (Low). Emitowane w `app/(marketing)/page.tsx:31,35`, `app/blog/[category]/[slug]/page.tsx:214,218`, `app/blog/[category]/page.tsx:122,126`. Gotowe snippety A–E w `findings/schema.md`. FAQPage — nie dodawać (rich results wycofane 7.05.2026).

## Performance — 78/100 (lab, Lighthouse 13.6)
| Strona | Mobile score / LCP / CLS | Desktop score / LCP |
|---|---|---|
| `/` | 75 / 6,4 s / 0,000 | 97 / 1,25 s |
| `/pricing` | 80 / 4,9 s / 0,000 | 98 / 1,1 s |
| `/blog` | 74 / 6,1 s / 0,070 | 97 / 1,1 s |
| `/blog/cv/jak-zrobic-cv` | 82 / 4,7 s / 0,000 (0,108 przy applied throttling) | 98 / 1,1 s |

TBT 0–65 ms (INP niezmierzony — brak CrUX). Problemy: LCP mobile = baner cookies po hydratacji (`CookieBanner.tsx:43`), hero z `opacity-0` do startu GSAP (High); 3× render-blocking `@import` fontów w `app/globals.css:1-3` (High); prawie wszystkie sekcje home `'use client'`, GSAP/framer-motion w głównym bundlu (Medium); obraz LCP na blogu z `loading="lazy"` (Medium); 2,6 MB transferu mobile na home, wideo 1,49 MB ładowane od razu (Medium); CLS od swapu fontów Sizmo Pro/Korbin `.otf` (Medium). Trackery (GA/Meta/TikTok) ładują się dopiero po zgodzie — dobrze.

## Images — 74/100
**Działa:** next/image → AVIF/WebP, hero z `fetchpriority=high`, reszta lazy, hero 44–83 KB.
**Braki:** 3 karty bloga na home z pustym `alt` + generyczne alt („tile”, „dashboard-img”); `career-path.webp` 224–379 KB serwowany (5,5 MB źródło); `/blog` ładuje 129 `<img>`; hero na mobile pobiera w=1920 (brak `sizes`); hero artykułu B2B to obraz z innego tematu.

## Mobile / UX (visual)
H1 i CTA widoczne above the fold. Baner cookies: 34% viewportu mobile, zasłania cenę Free na `/pricing` (High). 22–40 tap targetów < 44 px na stronę (Medium). CLS 0,806 na desktop po scrollu w sekcji `product-showcase` — niepotwierdzone przez Lighthouse (nie scrolluje), wymaga testu z przewijaniem. Brak poziomego overflow.

## AI Search Readiness — 60/100
Cytowalność 62, struktura 72, multimodalność 45, **autorytet/marka 30**, dostępność techniczna 88. Wszystkie boty AI (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot…) dostają 200 i pełny HTML. Słabo: encja marki (brak „O nas”, kolizja z Vocare UK w Wikidata/Wikipedii, YouTube 404, niespójny LinkedIn), leady „haczykowe” zamiast answer-first, statystyki bez źródeł, brak wykresów/wideo. `llms.txt` 404 — niski priorytet (Google ignoruje). Robots.txt bez świadomej polityki treningu AI — decyzja biznesowa.

## SXO
`/resume-creator` 33/100 — SERP „kreator cv” to ~85% działających edytorów; Vocare pokazuje landing, edytor za logowaniem; „za darmo” nieobecne w title/H1 mimo darmowego PDF. `/salary-calculator` pasuje do intencji, brak trybu netto→brutto i stron dla konkretnych kwot. Home i `/assistant` mają niemal identyczne H1 i intencję. Persona najsłabiej obsłużona: specjalista IT na `/resume-creator` (41/100).

## Backlinki — brak danych
vocare.pl nieobecna w grafie Common Crawl (cc-main-2026-jan-feb-mar). Podłączyć GSC (raport Linki) i Bing WMT, potem `/seo backlinks verify`. Taktyki: kalkulator jako linkable asset, raporty danych z market-analysis, PR do mediów HR, biura karier uczelni.
