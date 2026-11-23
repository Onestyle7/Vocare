# Vocare — Strategia SEO (12 miesięcy)

**Data:** 2026-11-23 · **Typ:** SaaS B2C (platforma kariery AI) + blog · **Rynek:** Polska, język polski
**Podstawa:** audyt `../FULL-AUDIT-REPORT.md` (70/100), baseline GSC `reports/gsc-baseline-2026-09-22.json`, eksport linków GSC 2026-11-23, rekonesans SERP.
Powiązane: `COMPETITOR-ANALYSIS.md` · `SITE-STRUCTURE.md` · `CONTENT-CALENDAR.md` · `IMPLEMENTATION-ROADMAP.md`

---

## 1. Diagnoza w jednym akapicie

Vocare ma solidny fundament techniczny i dużo treści (127 artykułów), ale **ruch organiczny pochodzi z treści informacyjnych, które słabo konwertują, a strony produktowe nie rankują.** W baseline (24.06–19.09) 86% wyświetleń to blog, a największa strona (`najlepiej-platne-zawody`, 6 946 wyśw.) nie ma związku z kupnem. Jedyna strona blogowa, która realnie dowozi kliknięcia z intencją produktową — `darmowy-kreator-cv` (86 kliknięć, CTR 6%) — obiecuje rzecz, której produkt nie daje za darmo. Jednocześnie Vocare ma **aktywa, których konkurencja nie ma**: własną bazę ofert pracy z widełkami, analizę rynku AI, roadmapy kariery. Strategia polega na przestawieniu SEO z „blog, który ściąga ruch” na **„narzędzia i własne dane, które ściągają ruch, a blog go podaje dalej”.**

## 2. Grupa docelowa i intencje

| Persona | Typowe zapytania | Strona docelowa | Etap lejka |
|---|---|---|---|
| Student / absolwent, pierwsza praca | „cv bez doświadczenia”, „praca dla studenta”, „jaki zawód wybrać” | kreator CV, artykuły CV, test/ścieżka kariery | TOFU → MOFU |
| Osoba zmieniająca branżę (28–45) | „jak zmienić branżę”, „przebranżowienie do IT”, „doradca zawodowy online” | doradca AI, roadmapa | MOFU → BOFU |
| Specjalista IT / B2B | „ile na rękę b2b”, „b2b czy uop”, „zarobki programisty 2026” | kalkulator, strony zarobków, analiza rynku | MOFU → BOFU |
| Aktywnie szukający pracy | „kreator cv”, „list motywacyjny”, „cv pod ofertę” | kreator CV + dopasowanie do oferty (TailorCv) | BOFU |

## 3. Pięć filarów strategii

### Filar A — Narzędzia jako strony docelowe (product-led SEO)
Google dla „kreator cv”, „kalkulator wynagrodzeń” chce **działającego narzędzia**, nie opisu. Dziś edytor CV jest za logowaniem.
- Kreator CV w trybie gościa (bez konta do pierwszego PDF), rejestracja dopiero przy zapisie/AI.
- Kalkulator wynagrodzeń z trybem netto→brutto i porównaniem UoP / zlecenie / B2B (ryczałt, liniowy, skala).
- Darmowy „mini-audyt CV” (np. 3 najważniejsze poprawki bez tokenów) jako magnes na „sprawdzenie cv”, „cv pod ats”.

### Filar B — Własne dane jako przewaga (data-led SEO + PR)
Vocare scrapuje oferty z widełkami (moduł JobOffers / Market Pulse — **na dziś tylko IT**: NoFluffJobs, SolidJobs) i ma analizę rynku AI. Nikt z konkurencji poza portalami pracy nie ma danych pierwotnych. Start: pilot dla stanowisk IT; inne zawody dopiero z nowym źródłem danych.
- Strony **„Zarobki: {stanowisko} 2026”** generowane z bazy ofert — tylko dla stanowisk z wystarczającą próbą (próg do ustalenia, np. ≥ 30 ofert), z medianą, widełkami, rozkładem B2B/UoP, wymaganymi umiejętnościami, linkiem do kalkulatora i roadmapy.
- Kwartalny **Raport Vocare: rynek pracy** (PDF + strona) — materiał dla mediów i linków.
- Naprawa `najlepiej-platne-zawody` na danych własnych + GUS: to dziś największa strona i najsłabsza metodologicznie.

### Filar C — Porządek w treści (konsolidacja zamiast produkcji)
Blog nie potrzebuje więcej artykułów, tylko mniej i lepszych.
- 3–4 przekierowania 301 dla kanibalizacji (po potwierdzeniu w GSC).
- Huby: każdy artykuł linkuje do filara kategorii (dziś CV 9/34, praca 8/37).
- Treści YMYL (podatki, prawo pracy): źródła urzędowe, „stan prawny na…”, recenzent.
- CTA dopasowane do tematu artykułu, nie kategorii.

### Filar D — Zaufanie i encja marki (E-E-A-T + GEO)
- Strona `/o-nas`, prawdziwi autorzy i recenzenci, rozbudowana encja `Organization` odróżniająca Vocare od brytyjskiego Vocare (NHS).
- Uczciwość ofertowa: usunąć „darmowe AI” z treści, ujawniać własny produkt w rankingach.
- Spójne profile (LinkedIn, YouTube, Reddit) w `sameAs`.

### Filar E — Autorytet zewnętrzny (linki + wzmianki)
Dziś ~9 domen odsyłających, 2 dofollow. Cel to nie liczba, tylko **linki do stron, które mają rankować** (kalkulator, kreator, zarobki).
- Biura karier uczelni i portale studenckie (studenckiesprawy.pl już linkuje).
- Media HR/finansowe na bazie raportu danych.
- Reddit r/praca, r/PolskaIT — odpowiedzi z linkiem do konkretnego narzędzia.
- Strony porównawcze (Vocare vs Canva / Enhancv / doradca zawodowy) — zbierają zapytania o konkurencję.

## 4. Zasady (czego NIE robimy)

- Nie produkujemy nowych artykułów „pod frazę” bez przewagi (dane, narzędzie, doświadczenie). Blog ma już 60/127 tekstów < 800 słów.
- Nie generujemy setek stron „X brutto ile to netto” jak OLX — przegramy autorytetem i ryzykujemy index bloat. Ewentualnie mały, testowy zestaw (patrz roadmapa, faza 3) z twardym sprawdzianem.
- Strony programatyczne „Zarobki: {stanowisko}” tylko z wystarczającą próbą danych; bez danych = noindex.
- Nie kupujemy linków, nie używamy PBN, nie dodajemy `aggregateRating` bez prawdziwych opinii, nie dodajemy FAQPage dla rich results (wycofane 7.05.2026), nie używamy HowTo.

## 5. KPI

Baseline z GSC (eksport 3.11.2026, task ClickUp „SEO – audyt vocare.pl i plan wzrostu ruchu”): **październik 2026 = 696 kliknięć / 42,8 tys. wyświetleń**; 2.08–1.11: 1 127 kliknięć, CTR ~1,6%, marka = 22% kliknięć. Strony produktowe łącznie: **14 kliknięć w 3 miesiące**. Pierwszy krok i tak: odświeżyć baseline na listopad (Supermetrics GSC).

| Metryka | Baseline (X 2026) | 3 mies. (II 2027) | 6 mies. (V 2027) | 12 mies. (XI 2027) |
|---|---|---|---|---|
| Kliknięcia organiczne / mies. | ~700 | 1 200 | 2 500 | 5 000 |
| Kliknięcia niebrandowe / mies. | ~540 | 950 | 2 100 | 4 300 |
| Wyświetlenia / mies. | ~43 tys. | 70 tys. | 130 tys. | 250 tys. |
| Kliknięcia na strony produktowe i danych (kreator, kalkulator, pricing, zarobki) / mies. | ~5 | 100 | 400 | 1 200 |
| Rejestracje z ruchu organicznego / mies. | do zmierzenia w GA4 (`sign_up`) | baseline + 50% | ×2 | ×4 |
| Domeny odsyłające (dofollow) | ~9 (2) | 15 (6) | 30 (15) | 60 (35) |
| LCP mobile (lab → CrUX p75) | 4,7–6,4 s (lab) | < 2,5 s | < 2,5 s | < 2,5 s |
| INP p75 | niezmierzony | zmierzony | < 200 ms | < 200 ms |
| SEO Health Score (re-audyt) | 70 | 82 | 87 | 90 |

Cele są szacunkami; trend VIII→X (138 → 696 kliknięć) częściowo wynika z konsolidacji duplikatów URL, więc nie ekstrapolujemy go liniowo. **Sprawdzian porażki:** jeśli po 3 miesiącach kliknięcia na strony produktowe < 30/mies., problemem nie jest SEO, tylko dopasowanie stron do intencji — wracamy do SXO.

**Ograniczenie danych (z tasku 10.11):** Market Pulse / JobOffers mają oferty tylko z NoFluffJobs i SolidJobs, czyli **IT**. Strony `/zarobki/{stanowisko}` startują wyłącznie jako pilot IT; zawody regulowane (nauczyciel, policjant, lekarz) wymagają źródeł urzędowych i są osobną decyzją.

**Decyzja do potwierdzenia:** `SoftwareApplication` było wcześniej odrzucone (task z 10.11). Plan zakłada `WebApplication` dla narzędzi i `Offer` na `/pricing` — wymaga ponownej decyzji (bramka D3 w ClickUp).

## 6. Zasoby — model z agentami

Prace wykonują **agenci (Claude Code)** pod nadzorem zespołu. To zmienia, co jest wąskim gardłem:

| Obszar | Kto | Wąskie gardło |
|---|---|---|
| Kod (frontend, backend, schema, wydajność, redirecty) | agent | review + merge + deploy przez człowieka |
| Edycja istniejących artykułów (źródła, linki, leady, konsolidacja) | agent | review redakcyjny; max ~10 artykułów/tydz., żeby nie odtworzyć sygnałów masowej produkcji |
| Nowe artykuły | agent pisze szkic **tylko** z dostarczonych danych/doświadczenia | człowiek wnosi doświadczenie, przykłady, akceptuje |
| Dane (GSC, GA4, Market Pulse SQL) | agent | dostęp (Supermetrics, DB) daje człowiek |
| Decyzje produktowe i ofertowe | **człowiek** | bramki D1–D8 |
| Autorzy, recenzja YMYL | **człowiek** / ekspert | prawdziwe osoby, nie generowane |
| Outreach, Reddit, PR, Wikidata | **człowiek** (agent przygotowuje materiały) | autentyczność; agent nie publikuje w imieniu marki |
| Pomiar efektów | agent (`/seo drift`, GSC) | opóźnienie Google 6–8 tyg. — nie da się skrócić |

Konsekwencje dla planu:
- **Fazy kodowe kompresują się z miesięcy do 2–3 sprintów**; tempo wyznacza przepustowość review, nie implementacja.
- **Treść celowo nie przyspiesza** — audyt pokazał już ślady masowej produkcji (szablonowe akapity, 92 daty na 3 dniach). Agent z łatwością wyprodukuje 100 artykułów; to byłby błąd.
- Każde zadanie dla agenta ma: zakres plików, kryteria akceptacji, komendy weryfikacji, listę „nie robić”, bramkę ludzką. Agent **nie commituje** — przygotowuje zmiany i proponuje commit.
- Zadania dzielone tak, żeby równoległe agenty nie edytowały tych samych plików (np. `proxy.ts`: najpierw fix CTA, potem redirecty 301).

## 7. Ryzyka

| Ryzyko | Prawdopodobieństwo | Mitigacja |
|---|---|---|
| Core update obniża blog z oznakami masowej produkcji | średnie | konsolidacja + E-E-A-T w fazie 1–2 zanim powstanie nowa treść |
| Za mało danych w JobOffers dla stron zarobków | średnie | próg próby; najpierw policzyć oferty per stanowisko; reszta noindex |
| Tryb gościa kreatora zwiększa koszty AI / nadużycia | niskie–średnie | gość = edytor + PDF bez AI; AI dopiero po rejestracji; rate limit |
| Agenci produkują za dużo treści / treść bez doświadczenia | wysokie bez reguł | limit ~10 edycji artykułów/tydz., nowe teksty tylko z danymi od człowieka, review redakcyjny obowiązkowy |
| Równoległe agenty w konflikcie na tych samych plikach | średnie | mapa plików w epiku; sekwencja dla `proxy.ts`, `layout.tsx`, `structuredData.ts` |
| Zmiany czekają na deploy (jak gałąź z 10.11) | wysokie | bramka D1 jako pierwsza; WIP limit: max 3 niezmergowane paczki naraz |
| Kolizja nazwy z Vocare UK utrudnia brand search | wysokie | „Vocare.pl” jako wariant marki, `disambiguatingDescription`, Wikidata |
| Dane podatkowe się dezaktualizują (2027) | pewne | data „stan prawny na”, przegląd w styczniu |
| Brak pomiaru (GSC/GA4 niepodłączone do analiz) | wysokie | Supermetrics GSC w tygodniu 1 |
