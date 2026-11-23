# Wydajnosc / Core Web Vitals - vocare.pl (2026-11-23)

Metoda: pomiar laboratoryjny, Lighthouse 13.6.0 (lokalny Chrome headless, symulowane throttling mobile 4G/4x CPU + desktop). Brak klucza Google API (PSI zwrocilo limit zapytan), brak danych polowych CrUX, wiec INP nie jest zmierzony - uzyto TBT jako przyblizenia. Strona glowna mierzona 3x (mobile) i 2x (desktop), reszta stron 1x w trybie symulowanym + 1x mobile z throttlingiem "devtools" (zastosowanym) jako kontrola.

## Wynik ogolny: ok. 78/100 (mobile ~75, desktop ~97)

## Metryki (mediana / jedyny pomiar, tryb symulowany)

| Strona | Urzadz. | Score | FCP | LCP | TBT (proxy INP) | CLS | TTFB | JS transfer / po rozpakowaniu | Skrypty |
|---|---|---|---|---|---|---|---|---|---|
| / | mobile | 75 (45/75/75) | 2.05 s | 6.4 s | 6 ms (outlier 1411) | 0.000 | ~55 ms | 356 / 1070 KB | 26 |
| / | desktop | 97 (81/97) | 0.6 s | 1.25 s | 0 | 0.002 | ~50 ms | 595 / 1842 KB | 42 |
| /pricing | mobile | 80 | 1.9 s | 4.9 s | 65 ms | 0.000 | 57 ms | 477 / 1395 KB | 34 |
| /pricing | desktop | 98 | 0.6 s | 1.1 s | 0 | 0.011 | 47 ms | 677 / 2068 KB | 47 |
| /blog | mobile | 74 | 2.3 s | 6.1 s | 20 ms | 0.070 | 54 ms | 475 / 1393 KB | 35 |
| /blog | desktop | 97 | 0.8 s | 1.1 s | 0 | 0.006 | 56 ms | 505 / 1475 KB | 38 |
| /blog/cv/jak-zrobic-cv | mobile | 82 | 1.9 s | 4.7 s | 0 | 0.000 | 48 ms | 398 / 1181 KB | 31 |
| /blog/cv/jak-zrobic-cv | desktop | 98 | 0.6 s | 1.1 s | 0 | 0.012 | 50 ms | 423 / 1243 KB | 33 |

Kontrola z zastosowanym throttlingiem (mobile): / score 64, LCP 8.5 s, CLS 0.072; /pricing 73, LCP 6.0 s, CLS 0.078; /blog 79, LCP 4.5 s, CLS 0.074; artykul 77, LCP 4.6 s, CLS 0.108 (>0.1).

TTFB: HTML z cache edge Vercel (x-vercel-cache: HIT, cache-control max-age=0, must-revalidate), ~0.17-0.22 s z curl. Pierwszy pomiar desktop strony glownej mial jednorazowy TTFB 3.5 s (zimny edge) - outlier, drugi pomiar OK. HTML: / 150 KB (22 KB br), /blog 709 KB raw (!), artykul 222 KB raw.

## Ustalenia

### 1. WYSOKI - LCP mobile to baner cookies, ktory pojawia sie dopiero po hydratacji
- Dowod: element LCP na /, /pricing = `div.text-muted-foreground` (tekst "Cenimy Twoja prywatnosc..."); przy throttlingu zastosowanym element render delay 7.8 s (/) i 5.2 s (/pricing).
- Przyczyna: `frontend/components/SupportComponents/CookieBanner.tsx` - `showBanner` ustawiany w `useEffect`, wiec baner (duzy blok tekstu 380x152 px na mobile) renderuje sie po zaladowaniu i hydratacji calego JS. Hero image ma wrapper `opacity-0` do czasu GSAP (`frontend/app/(marketing)/main-components/Hero.tsx`, `frontend/features/marketing/constants/animations.ts` -> `useHeroDashboardAnimation`, autoAlpha 0 + blur 14px), wiec nie jest kandydatem LCP przed animacja; na desktopie LCP = obraz hero z render delay ok. 1 s.
- Fix: (a) kompaktowy baner mobile (kilka linii, tekst dluzszy w "Ustawieniach") tak, by LCP przejal h1/obraz hero; (b) hero widoczny w SSR (usunac opacity-0/autoAlpha:0 i blur z poczatkowego stanu, animowac tylko transform), Hero jako Server Component z maly wyspa kliencka dla animacji; (c) mniej hydratacji (pkt 3). Oczekiwane: LCP mobile 6.4 s -> ok. 3 s (lab).

### 2. WYSOKI - render-blocking Google Fonts przez @import
- Dowod: `frontend/app/globals.css` linie 1-2 (`@import url('https://fonts.googleapis.com/css2?family=Poppins...')` oraz IBM Plex Mono); Lighthouse: blokowanie 780-870 ms na mobile, +10 zadan woff2 z fonts.gstatic.com (66 KB). Do tego 3 pliki CSS render-blocking (46 KB glowny, ~160-190 ms).
- Fix: `next/font/google` dla Poppins (self-host, preload, ograniczone wagi 300/400/500/600), usunac @import IBM Plex Mono jesli nieuzywany. Zysk FCP ok. 0.5-0.8 s mobile.

### 3. SREDNI/WYSOKI - ciezka hydratacja strony glownej (GSAP + framer-motion w glownym bundlu)
- Dowod: 1.07 MB JS po rozpakowaniu na mobile (1.84 MB desktop), chunk react-dom 199 KB raw odpowiada za 2.3 s scriptingu w jednym z uruchomien (TBT 1411 ms w pierwszym przebiegu, w kolejnych ~0-6 ms - duza zmiennosc). GSAP/ScrollTrigger w 5 chunkach, framer-motion (108 KB raw) w chunku 0a5uhfaf3a3r. Three.js, Spline i Lenis NIE sa ladowane na stronie glownej (SmoothScrollProvider zakomentowany w `frontend/app/layout.tsx`) - dobrze.
- Prawie wszystkie sekcje sa `'use client'`: Hero, Features, HowItWorks, Pricing, ProductShowcase, Footer (`frontend/app/(marketing)/main-components/*`, `.../assistant/components/Footer.tsx`).
- Fix: `next/dynamic` dla sekcji ponizej folda (Features, HowItWorks, Pricing, LatestArticles, Footer), lazy-import ScrollTrigger, przeniesienie statycznych sekcji na Server Components, framer-motion -> CSS tam gdzie mozliwe.

### 4. SREDNI - blog: obraz LCP ladowany lazy
- Dowod: /blog i artykul - element LCP `<img loading="lazy">`; resource load delay 0.35-2.0 s, LCP 4.5-6.1 s mobile. `frontend/features/blog/components/ArticleCard.tsx` (brak `priority`), `frontend/features/blog/components/MarkdownComponents.tsx` (pierwszy obraz artykulu bez `priority`).
- Pliki zrodlowe ogromne: `frontend/public/images/blog/career-path.webp` 5.5 MB, `interview-questions.webp` 3.7 MB, `job-search.webp` 3.5 MB, `career-path2.webp` 3.5 MB, `career-change.webp` 2.1 MB; karta ma 304 KB przy w=750.
- Fix: `priority`/`fetchPriority="high"` dla pierwszej karty i pierwszego obrazu artykulu; przeskalowac zrodla do <=1600 px, quality 60-70 dla kart; `sizes` juz jest. /blog ma 709 KB HTML - paginacja lub wirtualizacja listy.

### 5. SREDNI - transfer mobile strony glownej 2.6 MB przez wideo i plakaty
- Dowod: `Motion Design Roadmap.mp4` 1.49 MB pobrany przy zaladowaniu mimo `preload="metadata"` (`.../product-showcase/ProductShowcasePreview.tsx`; prawdopodobnie brak `faststart`/moov na koncu pliku - hipoteza), 4 plakaty webp 60-88 KB (300 KB) pobierane od razu. 5 plikow mp4 po 1.4-1.8 MB w `frontend/public/videos`.
- Fix: montowac `<video>` dopiero przy zblizeniu do viewportu (IntersectionObserver), `ffmpeg -movflags +faststart`, nizszy bitrate/WebM, plakaty lazy; hook `useProductShowcase.ts` ustawia `preload='auto'` - zostawic dopiero po wejsciu w widok.

### 6. SREDNI - CLS na granicy
- Dowod: artykul 0.108 (throttling zastosowany), /pricing 0.078, /blog 0.074, / 0.072. Zrodla: zamiana fontu Sizmo Pro (akapity artykulu, h1 bloga) - `frontend/app/layout.tsx` ma `preload: false` + `display: 'swap'` bez `adjustFontFallback`; /pricing: animowany naglowek `line-mask` z obrazkiem.
- Fix: preload uzywanych krojow Sizmo na /blog, `adjustFontFallback: 'Arial'` w `localFont`, zarezerwowane wymiary w naglowku pricing. Korbin ladowany jako .otf (`frontend/features/marketing/constants/fonts.ts`) - zamienic na woff2.

### 7. INFO - skrypty zewnetrzne (GA, Meta, TikTok) zalezne od zgody
- Dowod: `frontend/app/layout.tsx` + `frontend/lib/utils/google-analytics.ts`, `meta-pixel.ts`, `tiktok-pixel.ts`: male inline'y `beforeInteractive`, a gtag.js / fbevents.js / TikTok events.js doklejane dopiero po zgodzie. W labie przed zgoda: 0 requestow do trackerow, 3rd-party = tylko Google Fonts. Koszt po zgodzie NIE zmierzony (probny przebieg z ciasteczkami zgody zakonczyl sie bledem skryptu). Zalecenie: zmienic `beforeInteractive` na `afterInteractive`/`lazyOnload` dla inline'ow i zmierzyc wariant po zgodzie.

### 8. Pozytywy
TTFB 50-220 ms (statyczny prerender + edge), obrazy AVIF/WebP przez next/image, hero z `priority`/`fetchPriority=high` i preloadem, czcionki lokalne `display: swap`, brak Three/Spline/Lenis na publicznych stronach.

## Czego nie pokrywa pomiar
- Lighthouse w trybie nawigacji nie przewija strony. Zgloszone przez agenta wizualnego CLS 0.806 na desktopie / po przewinieciu (canvas `.product-showcase-module__backdrop`) NIE jest ani potwierdzone, ani obalone: moj CLS przy ladowaniu desktop = 0.002. Nie zbadalem `product-showcase/backdrop.ts` ani css; wymaga testu z przewijaniem (Chrome DevTools Performance / web-vitals w trybie dzialajacym po scrollu).
- INP: brak danych polowych (brak CrUX), TBT jako proxy; interakcje (zakladki ProductShowcase, baner) nie testowane.
