# SXO — Search Experience Optimization: vocare.pl

Data analizy: 2026-11-23 · Metoda: render Playwright (`render_page.py --mode always`) + analiza źródła SSR, SERP przez WebSearch (zapytania PL), taksonomia typów stron claude-seo SXO.

> Wynik w tym pliku to **SXO Gap Score** (dopasowanie strony do tego, co nagradza SERP). To nie jest SEO Health Score.

---

## 1. Najważniejsze ustalenie: /resume-creator to landing, a SERP chce działającego narzędzia (WYSOKI)

| Zapytanie | Dominujący typ w SERP (top ~15) | Pewność | Typ strony Vocare | Niedopasowanie |
|---|---|---|---|---|
| kreator cv / kreator cv online | **Tool/Interactive**: działające edytory (Canva, Enhancv /pl/kreator-cv, Jooble cv-builder, aplikuj.pl/cv, gowork.pl/kreator-cv, zielonalinia.gov.pl, jobseeker.com/pl/cv, CapCut, Creative Fabrica) | ~85% narzędzia, ~15% artykuły (antyweb) | Landing (`/resume-creator`, 460 słów, bez edytora) | **WYSOKI**: "Landing Page without interactive element" |
| kreator cv za darmo | Narzędzia z obietnicą "bez logowania / pobierz PDF za darmo" (Jooble, Canva, CapCut, gowork, wavespeed, zarabiaj.pl) + listy (antyweb x2, spidersweb, gowork blog) | ~65% narzędzia / ~35% listy | Landing; słowa "za darmo/bez opłat" nie ma w title, H1 ani opisie (pojawia się tylko w opiniach) | **WYSOKI** |
| najlepszy kreator cv 2026 / ranking | **Listy/porównania** (careerboom, ranktracker, antyweb, unite.ai, fixthephoto, zapier) | ~80% listy | `/blog/cv/kreator-cv` (lista "Ranking kreatorów CV online 2026") | **DOPASOWANE** (pod warunkiem przestawienia frazy docelowej) |
| kalkulator wynagrodzeń brutto netto (2026) | **Tool** (aplikuj, money.pl, poradnikprzedsiebiorcy, wynagrodzenia.pl, rocketjobs, pitax) + programmatic "X brutto ile to netto" (OLX, wynagrodzenia.pl, aplikuj /2026-brutto) | ~95% narzędzia | Tool (`/salary-calculator`, prawdziwy formularz, wynik renderowany po stronie serwera) | **DOPASOWANE** |
| doradca kariery AI | Rozproszony: chatbot (Jotform), artykuły (infor, antyweb), lista "10 najlepszych programów AI do kariery", raporty uczelni/Jisc | brak dominanty (<40%) | Landing (strona główna) + drugi landing `/assistant` | **ŚREDNI** |
| doradztwo zawodowe online | Treści informacyjne i instytucjonalne (EPALE, gov.pl/zpe, PARP, praca.gov.pl, infor, aplikuj porady, zielonalinia) | ~80% informacyjne | Landing SaaS (strona główna) | **WYSOKI**: strona główna nie zaspokoi tej intencji; potrzebny artykuł typu Hybrid |
| (marka) cennik vocare | Nawigacyjne/markowe | n/d | `/pricing` | **DOPASOWANE** |

### Co widzi anonimowy użytkownik / Googlebot na trasach aplikacji
- `/resume-creator`, `/assistant`, `/roadmap`, `/market-analysis` zwracają **200, `index, follow`, własny canonical**. To publiczne landingi marketingowe (348–460 słów), nie aplikacja. Indeksacja jest więc w porządku.
- Prawdziwy kreator działa pod `/dashboard/resume`. Ta trasa zwraca **307 na `/sign-in?...&reason=Sesja wygasła. Zaloguj się ponownie`** z `noindex, nofollow`. Google nie zobaczy więc żadnego działającego edytora CV.
- **Błąd konwersji:** wszystkie CTA "Sprawdź za darmo" / "Sprawdź swoje obecne CV" (`/resume-creator`, `/assistant`, strona główna) prowadzą do `/dashboard`. Nowa osoba, która nigdy nie była zalogowana, ląduje na stronie **logowania (nie rejestracji)** z komunikatem **"Sesja wygasła"**. Źródło: `frontend/proxy.ts:113`, gdzie `reason` jest doklejany bezwarunkowo dla każdego anonimowego wejścia na trasy chronione.

---

## 2. Kanibalizacja: blog vs /resume-creator dla "kreator cv"

O klaster "kreator cv" walczą trzy indeksowalne URL-e:

| URL | Title | Sygnały on-page |
|---|---|---|
| `/resume-creator` | "Kreator CV z AI i audytem ATS \| Vocare" | 460 słów, H1 "Stwórz CV, które trafia do rekruterów" (bez "kreator"), **0 schema**, brak FAQ, nie linkuje do bloga |
| `/blog/cv/kreator-cv` | "**Kreator CV online** 2026 - najlepsze narzędzia do tworzenia CV" | ~1100 słów, BlogPosting + BreadcrumbList, FAQ, 8 linków do `/resume-creator` |
| `/blog/cv/darmowy-kreator-cv` | "**Darmowy kreator CV** 2026 - stwórz CV online bez ukrytych opłat" | podobna struktura, ta sama lista (Vocare, Google Docs, Canva...) |

**Wniosek: tak, artykuł konkuruje ze stroną narzędzia.** Artykuł ma mocniejsze sygnały na frazę główną: dokładne dopasowanie w title i H1, więcej treści, schema. Google prawdopodobnie wybierze go zamiast `/resume-creator`. Typ strony (lista) nie pasuje jednak do SERP-u z narzędziami, więc dla "kreator cv" przegrywają oba URL-e. Według taksonomii "Blog Post about topic where users want a tool" to poziom **KRYTYCZNY**, jeśli właśnie ten URL zbiera ruch na frazę główną. `darmowy-kreator-cv` powtarza ten problem dla "kreator cv za darmo".

**Rekomendacja:**
1. `/blog/cv/kreator-cv` przestawić na intencję porównawczą: title "Ranking kreatorów CV 2026 - porównanie 6 narzędzi (darmowe i płatne)", H1 bez otwierającego "Kreator CV online". Dodać metodologię oceny i ujawnienie "Vocare to nasz produkt". Samodzielne stawianie się na 1. miejscu bez metodologii osłabia zaufanie.
2. `/blog/cv/darmowy-kreator-cv` przestawić na "pułapki płatnych kreatorów / jak pobrać CV w PDF za darmo" albo scalić z FAQ `/resume-creator` i ustawić 301.
3. `/resume-creator` ma przejąć frazy "kreator cv", "kreator cv online", "kreator cv za darmo": title np. "Darmowy kreator CV online z AI - pobierz PDF bez opłat | Vocare". Do tego link zwrotny do rankingu.

---

## 3. Historie użytkowników (z sygnałów SERP)

1. **Świadomość → decyzja:** "Jako osoba szukająca pracy chcę od razu zacząć wypełniać CV w przeglądarce, bez zakładania konta, żeby sprawdzić, czy narzędzie mi pasuje". *Sygnał:* 8 z top 10 dla "kreator cv online" to działające edytory; tytuły "bez logowania" (antyweb, zarabiaj.pl, wavespeed).
2. **Rozważanie:** "Jako kandydat chcę mieć pewność, że pobiorę PDF bez płacenia, zanim poświęcę godzinę na wpisywanie danych". *Sygnał:* "Ten naprawdę bezpłatny kreator CV" (Jooble), ostrzeżenie GoWork o płatnym PDF, opinie Trustpilot o BetterCV/Interviewme.
3. **Rozważanie:** "Jako osoba wybierająca narzędzie chcę porównać kilka kreatorów w jednym miejscu". *Sygnał:* SERP "najlepszy kreator cv 2026" składa się w ~80% z rankingów.
4. **Decyzja:** "Jako pracownik/student chcę wpisać kwotę brutto i od razu zobaczyć netto na UoP, zleceniu i B2B, również w drugą stronę (netto→brutto)". *Sygnał:* programmatic "X netto ile to brutto" (OLX, wynagrodzenia.pl), aplikuj "/2026-brutto".
5. **Świadomość:** "Jako osoba niezdecydowana chcę zrozumieć, czym jest doradztwo zawodowe online i czy AI może zastąpić doradcę". *Sygnał:* infor "Czy AI wyprze zawód doradcy zawodowego", EPALE, zielonalinia "Rola doradcy zawodowego".

---

## 4. SXO Gap Score (7 wymiarów, 100 pkt)

| Wymiar | /resume-creator ("kreator cv") | /salary-calculator ("kalkulator wynagrodzeń brutto netto") | Strona główna ("doradca kariery AI") | /pricing (markowe) |
|---|---|---|---|---|
| Typ strony (15) | 4: landing zamiast narzędzia | 14: narzędzie | 10: landing, SERP rozproszony | 13 |
| Głębia treści (15) | 7: 460 słów, brak FAQ, przykładów, szablonów; opis "Dopasowanie do oferty" jest kopią opisu "Analiza ATS" | 10: metodologia + tabela stawek; brak netto→brutto i stron dla konkretnych kwot | 9 | 12: bardzo dobre FAQ o tokenach, trialu i zwrotach |
| Sygnały UX (15) | 4: CTA → logowanie z "Sesja wygasła"; brak "za darmo" nad zgięciem | 12: wynik SSR (10 000 zł), porównanie 3 umów, przełączniki student / <26 lat | 10 | 11 |
| Schema (15) | 0: brak JSON-LD | 1: brak WebApplication/BreadcrumbList | 8: Organization, WebSite | 1: brak Offer/Product |
| Media (15) | 10: 26 obrazów, 2 wideo | 6: brak wykresu składowych | 12: 4 wideo, 24 obrazy | 6 |
| Autorytet (15) | 4: opinie "Anonim z Facebooka", obietnica "w 100% odporną na ATS", marka niewidoczna w wyszukiwaniu "vocare.pl" | 5: brak autora/eksperta i źródeł (ustawy, ZUS) wobec money.pl i Sedlak | 5 | 6 |
| Świeżość (10) | 4: brak daty i "2026" | 9: stawki 2026 w treści i tytule | 6: widżet bloga | 7 |
| **Razem** | **33/100** | **57/100** | **60/100** | **56/100** |

Dla "doradztwo zawodowe online" strona główna dostaje 3/15 za typ strony (SERP informacyjny), więc łącznie ok. 53/100.

Dodatkowe obserwacje:
- **Prawie identyczne H1** na stronie głównej ("Zaplanuj całą Swoją Karierę") i `/assistant` ("Nie szukaj pracy, Zaplanuj całą karierę"). Do tego title "AI doradca kariery" vs "Asystent Kariery AI": obie strony celują w tę samą intencję. Trzeba wybrać jedną stronę dla "doradca kariery AI" (rekomendacja: `/assistant`, title "Doradca kariery AI - ...", z linkowaniem ze strony głównej).
- H1 strony głównej nie zawiera ani "doradca", ani "AI".
- Pole newslettera w stopce każdej strony jest wyłączone ("Email (wkrótce)"), a obok stoi CTA "Subskrybuj newsletter". To martwy element, który obniża zaufanie.
- Przy pierwszym renderze strony głównej przechwyciliśmy stan fallbacku `app/loading.tsx` ("Ładowanie danych..."). Drugi render pokazał pełną treść. Raczej przypadek pod obciążeniem, ale warto to obserwować w GSC (Inspekcja URL → zrzut renderu).

---

## 5. Persony (Trafność / Klarowność / Zaufanie / Akcja, po 25 pkt)

| Persona | /resume-creator | /salary-calculator | Strona główna |
|---|---|---|---|
| **Specjalista IT** (CV techniczne, B2B, projekty/GitHub) | **12/14/9/6 = 41** | 20/19/15/13 = 67 | 12/15/10/15 = 52 |
| **Student szukający pierwszej pracy** (CV bez doświadczenia, zlecenie, ulga <26) | 13/15/10/6 = 44 | 22/20/15/14 = 71 | 14/14/11/15 = 54 |
| **Osoba zmieniająca branżę** (przekładanie kompetencji, luki, rynek) | 18/15/10/6 = 49 | 16/20/15/15 = 66 | 21/16/11/15 = 63 (historia "Marta odkrywa nowy kierunek") |

### Rekomendacje od najsłabszej persony
1. **Specjalista IT na /resume-creator (41):** dodać sekcję "CV programisty / CV IT" z przykładem: sekcja Projekty, linki GitHub/portfolio, stack. Pokazać zrzut audytu ATS dla oferty IT. Podlinkować `/salary-calculator` (B2B) i `/market-analysis`. W rankingu blogowym Overleaf jest polecany dla IT, a landing tego tematu w ogóle nie podejmuje.
2. **Student na /resume-creator (44):** H1/sub-H1 "Darmowy kreator CV, także bez doświadczenia". Blok "Pierwsze CV: co wpisać, gdy nie masz doświadczenia" (projekty uczelniane, wolontariat). CTA "Stwórz CV za darmo" → `/sign-up?callbackUrl=/dashboard/resume`, a nie `/dashboard`. Komunikat "Sesja wygasła" usunąć dla użytkowników bez cookie `token`.
3. **Zmieniający branżę na /resume-creator (49):** wyeksponować "Analizę braków" i "dopasowanie do oferty" jako główną obietnicę ("Zmieniasz branżę? Wklej ofertę, a pokażemy, których kompetencji brakuje"). Przykład przed/po.
4. **Wszyscy, akcja:** największy zysk dałoby udostępnienie kreatora anonimowo, np. tryb gościa pod publicznym URL z zapisem lokalnym i rejestracją dopiero przy zapisie lub pobraniu PDF. Dopiero to wyrówna typ strony z SERP-em. Jeśli to niemożliwe, osadzić na `/resume-creator` interaktywne demo: formularz 3 pól → podgląd CV.
5. **/salary-calculator:** dodać kierunek netto→brutto, H1 "Kalkulator wynagrodzeń brutto netto 2026", schema `WebApplication` + `BreadcrumbList`, sekcję źródeł (ustawa o PIT, ZUS) i opcjonalnie strony programmatic dla popularnych kwot (np. `/salary-calculator/5000-brutto`). Dla studenta CTA "Testuj 14 dni za 0 zł" zamienić na kontekstowe "Sprawdź, ile zarabia się na Twoim stanowisku" → `/market-analysis`.
6. **Doradztwo zawodowe online:** nie optymalizować strony głównej pod tę frazę. Lepiej artykuł Hybrid `/blog/kariera/doradztwo-zawodowe-online` (czym jest, ile kosztuje, bezpłatne opcje: urzędy pracy, Zielona Linia; AI vs doradca) z modułem produktu.

Odsyłacze: `/seo schema` (SoftwareApplication/WebApplication, Offer, BreadcrumbList), `/seo content` (E-E-A-T rankingu blogowego i opinii), `/seo page` dla `/resume-creator`.

---

## 6. Ograniczenia
- WebSearch nie jest wynikiem Google.pl. Nie widać reklam, AI Overview, PAA, featured snippetów, lokalizacji ani personalizacji. Pozycje są przybliżone, a "kreator cv" zwracało częściowo szum ("kreatywne CV").
- Brak danych o wolumenach, pozycjach Vocare i CTR (GSC/Ahrefs niedostępne). Zapytanie "vocare.pl" nie zwróciło domeny, co sugeruje słabą widoczność marki, ale wymaga potwierdzenia w GSC.
- Nie testowaliśmy przepływu po zalogowaniu (edytor CV, eksport PDF) ani Core Web Vitals.
- Oceny person są ekspertyzowe, nie z badań z użytkownikami.

---

## 7. Dane strukturalne (do audit-data.json, kategoria "Search Experience")

```json
{
  "category": "Search Experience",
  "sxo_gap_scores": {"/resume-creator": 33, "/salary-calculator": 57, "/": 60, "/pricing": 56},
  "findings": [
    {"id": "sxo-01", "severity": "high", "url": "/resume-creator", "title": "Landing zamiast narzędzia dla 'kreator cv' (SERP ~85% działających edytorów); edytor /dashboard/resume za logowaniem i noindex"},
    {"id": "sxo-02", "severity": "high", "url": "/blog/cv/kreator-cv, /blog/cv/darmowy-kreator-cv", "title": "Kanibalizacja klastra 'kreator cv' / 'kreator cv za darmo' przez artykuły z dokładnym dopasowaniem w title/H1"},
    {"id": "sxo-03", "severity": "high", "url": "frontend/proxy.ts:113", "title": "CTA 'Sprawdź za darmo' prowadzi anonimów na /sign-in z komunikatem 'Sesja wygasła' zamiast na /sign-up"},
    {"id": "sxo-04", "severity": "high", "url": "/", "title": "Strona główna nie pasuje do informacyjnego SERP 'doradztwo zawodowe online'"},
    {"id": "sxo-05", "severity": "medium", "url": "/, /assistant", "title": "Dwa landingi z niemal identycznym H1 celują w 'doradca kariery AI'"},
    {"id": "sxo-06", "severity": "medium", "url": "/resume-creator", "title": "Brak 'za darmo/bez opłat' w title/H1 mimo darmowego kreatora (cennik: 0 tokenów); brak schema"},
    {"id": "sxo-07", "severity": "medium", "url": "/salary-calculator", "title": "Narzędzie dopasowane do SERP, ale brak netto→brutto, schema i stron programmatic dla kwot"},
    {"id": "sxo-08", "severity": "low", "url": "global footer", "title": "Wyłączone pole newslettera 'Email (wkrótce)' przy CTA 'Subskrybuj'"},
    {"id": "sxo-09", "severity": "low", "url": "/resume-creator", "title": "Zduplikowany opis karty 'Dopasowanie do oferty' (kopia 'Analiza ATS')"}
  ]
}
```
