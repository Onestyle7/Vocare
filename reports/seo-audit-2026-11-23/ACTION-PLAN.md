# vocare.pl — Plan działań SEO

Audyt: 2026-11-23 · SEO Health Score: **70/100** · Typ: SaaS + publisher (blog 127 artykułów)

Kolejność uwzględnia zależności. Każdy punkt ma: **dlaczego** (obserwacja), **sprawdzian porażki** (jak poznamy, że nie zadziałało) i **wskaźnik** do obserwacji bez ponownego audytu.

---

## Faza 1 — Krytyczne i szybkie (tydzień 1)

Brak problemów blokujących indeksację. Faza 1 to rzeczy, które szkodzą zaufaniu/konwersji lub są tanie, a wysokie w wpływie.

### 1.1 Usunąć fałszywe „bezpłatnie” z artykułów o kreatorze CV — HIGH (zaufanie / ryzyko prawne)
- **Dlaczego:** `features/blog/articles/darmowy-kreator-cv.md:3` (meta description) i treść obiecują analizę AI i dopasowanie CV „bez opłat”; `/pricing` wycenia je na 10 i 20 tokenów. To samo w `kreator-cv.md`. Wprowadzające w błąd twierdzenie w treści o najwyższym CTR na blogu.
- **Fix:** „Kreator i eksport PDF za darmo, analiza AI i dopasowanie w Premium lub za tokeny”.
- **Porażka:** wzrost zwrotów/skarg „myślałem, że darmowe”; brak zmiany CTR po zmianie opisu.
- **Wskaźnik:** CTR i współczynnik rejestracji z tych dwóch URL w GSC/GA4.

### 1.2 Naprawić CTA „Sprawdź za darmo” i komunikat „Sesja wygasła” — HIGH (konwersja)
- **Dlaczego:** CTA na `/`, `/resume-creator`, `/assistant` prowadzi do `/dashboard`; `proxy.ts:113` dokleja `reason=Sesja wygasła. Zaloguj się ponownie` **każdemu** niezalogowanemu. Nowy użytkownik widzi logowanie z komunikatem o wygaśnięciu sesji zamiast rejestracji. Zweryfikowane na produkcji (307 → `/sign-in?...reason=Sesja+wygasła`).
- **Fix:** CTA → `/sign-up?callbackUrl=/dashboard/...`; w `proxy.ts` dodawać `reason` tylko gdy request miał wcześniej cookie `token`/`userId` (faktycznie wygasła sesja).
- **Porażka:** konwersja landing → rejestracja bez zmiany po 2 tygodniach.
- **Wskaźnik:** zdarzenie `sign_up` / sesje z landingów.

### 1.3 Fonty: zamienić `@import` Google Fonts na `next/font` — HIGH (LCP)
- **Dlaczego:** `app/globals.css:1-3` — trzy `@import` (Poppins, IBM Plex Mono z 14 wagami, Inter) blokują render ~0,8 s na mobile.
- **Fix:** `next/font/google` z tylko używanymi wagami; sprawdzić, czy IBM Plex Mono w ogóle jest potrzebny na publicznych stronach.
- **Porażka:** FCP mobile w Lighthouse nie spada poniżej ~1,5 s.
- **Wskaźnik:** FCP/LCP w Vercel Speed Insights.

### 1.4 Kompaktowy baner cookies na mobile — HIGH (LCP + UX)
- **Dlaczego:** baner zajmuje 34% viewportu na mobile, zasłania cenę planu Free na `/pricing` i jest elementem LCP (render po hydratacji przez `useEffect` w `components/SupportComponents/CookieBanner.tsx:43`) → LCP mobile 4,7–6,4 s.
- **Fix:** jedna linia tekstu + 2 przyciski w rzędzie, max ~100 px wysokości; hero bez `opacity-0`/`autoAlpha:0` na starcie (`app/(marketing)/main-components/Hero.tsx`, `features/marketing/constants/animations.ts`), żeby LCP był obrazem/H1 z SSR.
- **Porażka:** LCP mobile w labie > 4 s po zmianie.
- **Wskaźnik:** LCP p75 w Speed Insights / CrUX.

### 1.5 Drobne poprawki nagłówków i metadanych (30 min) — LOW
- `poweredByHeader: false` w `next.config.ts`.
- HSTS z `includeSubDomains; preload`.
- Ujednolicić URL strony głównej: sitemap `https://vocare.pl/` vs canonical `https://vocare.pl` (`app/sitemap.ts:36`, `features/marketing/utils/metadata.ts:31,36`).
- Ujednolicić LinkedIn w `sameAs` i stopce (`features/marketing/constants/index.ts:386`).
- Literówka „mediananami” w opisie `najlepiej-platne-zawody`.

### 1.6 Podłączyć Google Search Console + Bing Webmaster Tools do wtyczki — prerequisite
- Bez nich brak danych polowych CWV (INP), backlinków i potwierdzenia kanibalizacji. Odblokowuje 2.1, 3.4 i pomiar wszystkiego powyżej.
- `/seo google setup` (klucz API do PSI/CrUX + konto usługi GSC).

---

## Faza 2 — Wysoki wpływ (tygodnie 2–3)

### 2.1 Konsolidacja kanibalizujących artykułów (301) — HIGH
Zależność: najpierw potwierdzić w GSC (1.6), które URL zbierają wyświetlenia na wspólne frazy.
| Z | Do | Pewność |
|---|---|---|
| `/blog/cv/jak-napisac-list-motywacyjny` | `/blog/cv/list-motywacyjny` | wysoka (~7/10 wspólnych w SERP, identyczna struktura) |
| `/blog/kariera/doradztwo-zawodowe` | `/blog/kariera/doradca-zawodowy` | wysoka (H2 pokrywają się niemal w całości) |
| `/blog/cv/darmowy-kreator-cv` | `/resume-creator` | wysoka (SERP „kreator cv” = narzędzia) |
| `/blog/cv/jak-zrobic-cv` | `/blog/cv/cv` | średnia — potwierdzić w GSC |

Przeprofilować zamiast scalać: `cv-do-pracy` → „dopasowanie CV do oferty” (funkcja TailorCv), `kreator-cv` → „Ranking kreatorów CV 2026” z metodologią i ujawnieniem, że Vocare to własny produkt.
Redirecty dodać w `proxy.ts` obok istniejących 308; usunąć stare URL z sitemapy i zaktualizować linki wewnętrzne.
- **Porażka:** po 6–8 tygodniach docelowy URL nie przejmuje wyświetleń źródłowego.
- **Wskaźnik:** GSC → Skuteczność → filtr strony.

### 2.2 `/resume-creator` jako strona narzędzia — HIGH (SXO 33/100)
- **Dlaczego:** dla „kreator cv” ~85% wyników to działające edytory; `/resume-creator` to landing bez edytora, a prawdziwy kreator jest za logowaniem.
- **Fix:** tryb gościa lub interaktywne demo edytora na stronie; „Darmowy kreator CV” w title/H1; JSON-LD `WebApplication` z `offers.price=0`.
- **Porażka:** brak wejścia w top 20 na „kreator cv za darmo” po 3 miesiącach.
- **Wskaźnik:** pozycja/wyświetlenia frazy w GSC.

### 2.3 Strona „O nas” + rozbudowa encji Organization — HIGH (E-E-A-T, GEO)
- **Dlaczego:** `/about`, `/o-nas`, `/kontakt` = 404; nazwa „Vocare” koliduje z brytyjską firmą (Wikidata Q39086452).
- **Fix:** `/o-nas` (kto tworzy, misja, kontakt); w `features/marketing/utils/structuredData.ts` dodać `@id`, `description`, `disambiguatingDescription` („polska platforma kariery AI, nie mylić z Vocare UK”), `founder`, `areaServed: PL`, `contactPoint`.
- **Porażka:** zapytanie „vocare” w Google.pl nadal nie pokazuje vocare.pl w top 3.
- **Wskaźnik:** wyświetlenia zapytań markowych w GSC.

### 2.4 Autorzy-osoby dla treści YMYL — HIGH
- **Dlaczego:** 127/127 artykułów „Autor: Vocare”; tematy podatkowe, prawne, płacowe bez nazwanej osoby ani recenzenta.
- **Fix:** strony autorów, `Person` w `BlogPosting.author`, pole `reviewer` (np. księgowy/prawnik) w `features/blog/types.ts`, render w `app/blog/[category]/[slug]/page.tsx:163`. Tylko prawdziwe osoby.
- **Porażka:** brak poprawy pozycji artykułów prawno-finansowych po kolejnym core update.

### 2.5 JSON-LD dla stron produktowych — MEDIUM
`SoftwareApplication` + `Offer` (Free 0 zł, Premium 29 zł/mies., pakiet 500 tokenów 19 zł) na `/pricing`; `WebApplication` na `/resume-creator` i `/salary-calculator`; `Blog` z `@id` na `/blog`; powiązanie encji przez `@id`. Gotowe snippety: `findings/schema.md`. Bez `aggregateRating` bez realnych opinii. **Nie** dodawać FAQPage (rich results wycofane 7.05.2026).

### 2.6 Paginacja `/blog` — MEDIUM
- **Dlaczego:** jeden dokument 709 KB HTML, 129 `<img>`, `?page=2` zwraca to samo (`app/blog/page.tsx:5,7` przekazuje całą listę do `SearchView`).
- **Fix:** paginacja po stronie serwera (np. 24/str.), do klienta tylko pola kafelków; pierwszy obraz bez `loading="lazy"` (`features/blog/components/ArticleCard.tsx`).

### 2.7 Lżejsza strona główna — MEDIUM
`next/dynamic` dla sekcji pod foldem (Features, HowItWorks, ProductShowcase, Pricing, Footer w `app/(marketing)/main-components`), lazy ScrollTrigger; wideo `Motion Design Roadmap.mp4` (1,49 MB) ładować dopiero w viewport + `ffmpeg -movflags +faststart`; rekompresja `public/images/blog/career-path.webp` (5,5 MB źródło). Zbadać CLS 0,8 po scrollu w sekcji `product-showcase` (DevTools Performance + scroll).

---

## Faza 3 — Treść i autorytet (miesiąc 2)

### 3.1 Wzmocnić treści prawno-finansowe
15/26 artykułów prawno-finansowych < 800 słów, 9 bez źródła urzędowego. Wzorzec: `zwolnienie-lekarskie-l4` / `ile-na-reke-b2b` — link do ISAP/ZUS przy każdym przepisie, „Stan prawny na …”.

### 3.2 Poprawić `najlepiej-platne-zawody` (największa strona w GSC, 6 946 wyświetleń)
Pojedyncze mediany ze źródłem i datą (GUS, NoFluffJobs), „widełki” zamiast „mediana”, ranking jako tabela.

### 3.3 Linkowanie wewnętrzne
- Wszystkie 34 artykuły CV i 37 „praca” → link do filara (dziś 9/34 i 8/37).
- `/salary-calculator` w ~15 artykułach o wynagrodzeniach (dziś 2).
- CTA per artykuł zamiast per kategoria (pole `promo:` we frontmatter; `features/marketing/constants/promo.ts`) — dziś artykuły o mobbingu i L4 pokazują „Zrób CV za darmo”.

### 3.4 Leady answer-first i źródła statystyk
W ~30 artykułach o największym ruchu (wg GSC): odpowiedź w pierwszych 50 słowach, źródło przy każdej liczbie (22 artykuły mają procenty bez linku), usunąć nieweryfikowalne liczby ze strony głównej („99% dopasowania”, „100% odporne na ATS”).

### 3.5 Nowe treści (luki tematyczne pod produkt)
Sprawdzenie CV pod ATS · Czym jest ATS · „Jak zostać X w 12 miesięcy” (roadmapa) · Zarobki wg stanowiska i poziomu · Przebranżowienie do IT · Doradca kariery AI vs doradca zawodowy · dokończyć szkice `_szukanie-pracy-w-dobie-ai.md` i `_ukryty-rynek-pracy.md`.

### 3.6 Link building
Kalkulator wynagrodzeń jako linkable asset (widżet z atrybucją), kwartalny raport danych z market-analysis dla mediów HR, biura karier uczelni, katalogi narzędzi AI. Bez kupowania linków.

### 3.7 Higiena dat
`updatedAt` tylko przy zmianie merytorycznej (92/127 dat skupione na 3 dniach); `lastmod` dla 10 stron statycznych w `app/sitemap.ts`; usunąć `changefreq`/`priority`.

---

## Faza 4 — Monitoring (na bieżąco)

- `/seo drift baseline https://vocare.pl` teraz, `/seo drift compare` po każdym większym deployu.
- Co miesiąc: GSC (wyświetlenia markowe, strony po 301, CTR artykułów CV), Speed Insights (LCP/INP/CLS p75).
- Decyzja o polityce treningu AI w `robots.txt` (dziś wszystko dozwolone — świadomie zostawić lub zablokować boty treningowe, zostawiając wyszukiwanie).
- Opcjonalnie: `llms.txt`, IndexNow + Bing (1–2 h).
