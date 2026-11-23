# Roadmapa wdrożenia SEO — vocare.pl

> **Aktualizacja 2026-11-23:** wykonanie przechodzi na agentów (Claude Code). Źródłem prawdy dla zadań jest epik w ClickUp (Sprint 19) — tam każda paczka ma zakres plików, kryteria akceptacji, weryfikację i bramki ludzkie. Fazy kodowe poniżej kompresują się do ~3 sprintów; harmonogram treści i pomiaru zostaje (opóźnienie Google). Model pracy: `SEO-STRATEGY.md` §6.

Start: tydzień od 2026-11-30. Faza 1 pokrywa się z `../ACTION-PLAN.md` (fazy 1–2 audytu); kolejne fazy dokładają strategię.
Każdy punkt: **zależność** · **sprawdzian porażki** · **wskaźnik**.

---

## Faza 1 — Fundament (tygodnie 1–4, XII 2026)

| # | Zadanie | Kto | Zależność | Sprawdzian porażki | Wskaźnik |
|---|---|---|---|---|---|
| 1.1 | Podłączyć GSC + GA4 do analiz (Supermetrics), odświeżyć baseline | Ty | — | brak danych z ostatnich 28 dni | baseline zapisany |
| 1.2 | `/seo drift baseline https://vocare.pl` | Claude | — | — | snapshot |
| 1.3 | Usunąć fałszywe „darmowe AI” z `darmowy-kreator-cv`, `kreator-cv` | redakcja | — | — | CTR/konwersja artykułu |
| 1.4 | CTA → `/sign-up`; `reason=Sesja wygasła` tylko przy faktycznej sesji (`proxy.ts:113`) | dev | — | konwersja landing→rejestracja bez zmian po 2 tyg. | `sign_up` z landingów |
| 1.5 | `next/font` zamiast 3× `@import` (`globals.css:1-3`); kompaktowy baner cookies; hero widoczne w SSR | dev | — | LCP mobile lab > 4 s | LCP (Speed Insights) |
| 1.6 | Nagłówki: `poweredByHeader:false`, HSTS preload, URL home, LinkedIn w sameAs | dev | — | — | — |
| 1.7 | JSON-LD: `/pricing` (SoftwareApplication+Offer), narzędzia (WebApplication), `/blog` (Blog), `@id` encji | dev | — | błędy w Rich Results Test | 0 błędów schema |
| 1.8 | `/o-nas` + rozbudowa `Organization` (disambiguatingDescription vs Vocare UK) | Ty + dev | — | brand query nie pokazuje vocare.pl w top 3 po 8 tyg. | wyświetlenia brand w GSC |
| 1.9 | 301: list motywacyjny, doradztwo (pewne); jak-zrobic-cv, darmowy-kreator-cv (po 1.1) | dev | **1.1** | docelowy URL nie przejmuje wyświetleń po 6–8 tyg. | GSC per URL |
| 1.10 | Linki do filarów + `promo:` per artykuł + kalkulator w ~15 artykułach | dev + redakcja | — | — | kliknięcia blog → narzędzia (GA4) |

**Kamień milowy fazy 1:** SEO Health Score ≥ 78 w re-audycie technicznym; LCP mobile lab < 3 s; 0 sprzecznych obietnic cenowych.

## Faza 2 — Ekspansja (tygodnie 5–12, I–II 2027)

| # | Zadanie | Zależność | Sprawdzian porażki | Wskaźnik |
|---|---|---|---|---|
| 2.1 | **Kreator CV w trybie gościa** (edytor + PDF bez konta; AI po rejestracji) | 1.4 | brak wejścia w top 20 „kreator cv za darmo” po 3 mies.; wzrost nadużyć | pozycja, % gości → rejestracja |
| 2.2 | Kalkulator: netto→brutto, porównanie form zatrudnienia | — | brak wzrostu wyświetleń „kalkulator wynagrodzeń” po 8 tyg. | wyświetlenia/kliknięcia |
| 2.3 | Darmowy mini-audyt CV pod ATS (`/resume-creator/sprawdz-cv`) | 2.1 | < 5% użytkowników mini-audytu rejestruje się | konwersja |
| 2.4 | Autorzy-osoby + strony `/autor` + recenzent w treściach podatkowo-prawnych | 1.8 | — | — |
| 2.5 | Aktualizacja stawek 2027 + filar „Prawa pracownika” | — | — | wyświetlenia klastra prawnego |
| 2.6 | Paginacja `/blog`, lazy wideo na home, `next/dynamic` dla sekcji pod foldem | 1.5 | — | LCP/INP p75 |
| 2.7 | Treści lutowe (ATS, CV pod ofertę, Vocare vs Canva) | 2.3 | — | — |
| 2.8 | Outreach #1: studenckiesprawy.pl (link do narzędzia), 5 biur karier uczelni | 2.1 | 0 nowych domen po 6 tyg. | domeny odsyłające (GSC) |

**Kamień milowy:** ≥ 400 kliknięć/mies.; ≥ 50 kliknięć/mies. na strony narzędzi; ≥ 15 domen odsyłających.

## Faza 3 — Skala (tygodnie 13–24, III–V 2027)

| # | Zadanie | Zależność | Sprawdzian porażki | Wskaźnik |
|---|---|---|---|---|
| 3.1 | **Backend:** endpoint agregatów zarobków z JobOffers (mediana, widełki, B2B/UoP, umiejętności) per stanowisko; policzyć próby | — | < 15 stanowisk z próbą ≥ progu → przeprojektować (np. grupy stanowisk) | liczba stanowisk z danymi |
| 3.2 | **Pilotaż `/zarobki`**: 10–15 stron + hub + metodologia | 3.1 | < 50% stron zaindeksowanych po 6 tyg. lub 0 wyświetleń → wstrzymać skalowanie | indeksacja, wyświetlenia |
| 3.3 | Raport Q1 2027 + PR do mediów | 3.1 | 0 publikacji/linków po 4 tyg. | linki, wzmianki |
| 3.4 | Quiz „kierunek kariery” bez rejestracji | 2.1 | — | wyświetlenia „test predyspozycji” |
| 3.5 | Answer-first i źródła w 30 najważniejszych artykułach | 1.1 | — | AI Overviews (GSC Generative AI report) |
| 3.6 | Reddit / LinkedIn — regularna obecność z linkami do narzędzi | — | — | ruch z referral |
| 3.7 | Opcjonalny test: 20 stron „{kwota} brutto ile to netto” dla najczęstszych kwot | 2.2 | brak wyświetleń po 8 tyg. → noindex i usunąć | wyświetlenia |

**Kamień milowy:** ≥ 1 000 kliknięć/mies.; ≥ 250 kliknięć/mies. na strony produktowe/danych; ≥ 30 domen odsyłających; CrUX LCP p75 < 2,5 s.

## Faza 4 — Autorytet (miesiące 7–12, VI–XI 2027)

| # | Zadanie | Zależność | Sprawdzian porażki |
|---|---|---|---|
| 4.1 | `/zarobki` → 30–50+ stanowisk (jeśli pilotaż ≥ cele) | 3.2 | spadek średniego CTR stron zarobków przy skalowaniu |
| 4.2 | Raporty kwartalne Q2, Q3 — stały rytm PR | 3.3 | — |
| 4.3 | Seria „Jak zostać {zawód}” (roadmapa + zarobki + CV) | 3.2 | — |
| 4.4 | Porównania (Enhancv, doradca AI vs doradca) | — | — |
| 4.5 | Wikidata dla Vocare.pl, profil YouTube z krótkimi poradnikami | 1.8 | — |
| 4.6 | Program partnerski z biurami karier (materiały + link) | 2.8 | — |
| 4.7 | Przegląd bloga: scalić/noindex teksty bez wyświetleń 12 mies. | 1.1 | — |
| 4.8 | Re-audyt `/seo audit` + `/seo drift compare` | — | Health Score < 85 |

**Kamień milowy:** 2 500–3 000 kliknięć/mies.; ≥ 1 000 kliknięć/mies. na strony produktowe/danych; ≥ 60 domen odsyłających (≥ 35 dofollow); Health Score ≥ 88.

---

## Mapa zależności (najważniejsze)

```
1.1 GSC ──► 1.9 redirecty 301 ──► 4.7 przegląd bloga
1.4 CTA ──► 2.1 kreator gość ──► 2.3 mini-audyt ──► 2.7 treści ATS
                     └──────────► 2.8 outreach (link do narzędzia, nie do home)
1.8 /o-nas ──► 2.4 autorzy ──► 4.5 Wikidata
3.1 dane JobOffers ──► 3.2 pilotaż /zarobki ──► 4.1 skala ──► 4.3 „Jak zostać…”
                 └──► 3.3 raport ──► 4.2 PR kwartalny
```

Najdłuższa ścieżka krytyczna to **3.1 → 3.2 → 4.1** (dane zarobków). Warto zlecić policzenie ofert per stanowisko (3.1, część analityczna) już w fazie 1 — to jedna kwerenda SQL, a decyduje o największej inwestycji w planie.
