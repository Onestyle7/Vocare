# Content Quality / E-E-A-T – vocare.pl

Data: 2026-11-23. Zakres: wszystkie 141 URL z `raw/sitemap.xml` pobrane curlem (127 artykułów, 4 huby kategorii, /blog, strony produktowe i prawne). Wszystkie odpowiedziały 200. Słowa liczone w `<article>` (wliczony blok promo, ok. 40 słów). Kod źródłowy: `/Users/bartek/Desktop/Vocare/frontend`. Kanibalizację opisuje osobny raport klastrów, tutaj są tylko odwołania do niego.

## Wyniki

| Obszar | Wynik |
|---|---|
| **Content Quality** | **56/100** |
| **On-Page SEO** | **74/100** |
| Gotowość do cytowania przez AI | 70/100 |
| E-E-A-T (ważone) | 43/100 |

Tabela E-E-A-T. Wagi to wewnętrzny model tego audytu, nie Google.

| Czynnik | Waga | Wynik | Uzasadnienie |
|---|---|---|---|
| Experience | 20% | 30 | Własne dane są tylko w 3 artykułach liczonych kalkulatorem. Poza nimi nie ma case studies, cytatów rekruterów ani danych z platformy. |
| Expertise | 25% | 45 | Ogólna poprawność merytoryczna. Brak autorów z kwalifikacjami. Zdarzają się błędy językowe i metodologiczne. |
| Authoritativeness | 25% | 35 | Brak osób, strony /about (404) i stron autorów (/blog/autor: 404). Część źródeł to blogi konkurencji. |
| Trustworthiness | 30% | 55 | Jest e-mail, regulamin, disclaimery podatkowe i źródła gov.pl w tekstach finansowych. Minusy: deklaracja „bezpłatnie” sprzeczna z cennikiem oraz nieweryfikowalne liczby na stronie głównej. |

## Co działa

- Wzorcowe artykuły finansowe: `/blog/rynek-pracy/ile-na-reke-b2b`, `brutto-netto-umowa-zlecenie`, `umowa-o-prace-vs-b2b`. Odpowiadają w pierwszym zdaniu, podają własne tabele z kalkulatora, założenia, źródła (podatki.gov.pl, zus.pl) i disclaimer. Stawki 2026 są wewnętrznie spójne (podstawa 5 652 zł, ZUS 1 926,76 zł).
- Część artykułów prawnych ma pełne źródła: L4 (4 linki do ZUS/ISAP), umowa na czas określony (4), urlop macierzyński (3), delegacja (eli.gov.pl).
- Struktura sprzyja cytowaniu przez AI: „Najważniejsze wnioski” w 125/127, FAQ w 127/127, tabele w 100/127. H1 = title w 127/127, jeden H1 na stronę. Canonical, BlogPosting i BreadcrumbList wszędzie.
- `author` w schemacie ma typ Organization i zgadza się z rzeczywistością (`app/blog/[category]/[slug]/page.tsx:163-172`).
- Każdy artykuł linkuje do produktu (1–8 linków), anchory są zróżnicowane, linki prowadzą do podstron, nie do `/`.
- `metadata_template.py`: site_risk=low, templated_ratio=0.0, shared_cta_phrases={}. 9 flag brand-suffix to fałszywe alarmy (naturalne zdania).
- Czytelność jest przystępna: mediana zdania 17 słów, FOG-PL ok. 14,5. Teksty prawne są trudniejsze (mobbing 16).

## Ustalenia

### KRYTYCZNE

**1. Obietnica „bezpłatnie” jest sprzeczna z cennikiem (Trust/UOKiK)**
- Dowód: `/blog/cv/darmowy-kreator-cv` pisze: „pełna funkcjonalność, w tym analiza AI i generowanie CV pod ofertę, jest dostępna bezpłatnie”, a meta description: „analizować je AI i dopasowywać do konkretnych ofert – bez opłat”. Tymczasem `/pricing`: Free = sam kreator, ocena CV kosztuje 10 tokenów, dopasowanie 20 tokenów, Premium 29 zł. To samo w `/blog/cv/kreator-cv` („jedyny kreator… dostępny bezpłatnie”).
- Naprawa: przepisać na „kreator i PDF za darmo; analiza AI i dopasowanie w Premium lub za tokeny” i poprawić description. Strona ma 1377 wyświetleń w GSC i najwyższy CTR na blogu.

### WYSOKIE

**2. Brak autorów i osób za serwisem przy tematach YMYL**
- Dowód: 127/127 artykułów ma „Autor: Vocare”. Brak /about i stron autorów. Operator (osoba fizyczna, działalność nierejestrowana) jest wskazany wyłącznie w regulaminie. Plan z 22.09 (`reports/blog-plan-poprawkowy-2026-09-22.md`, Faza 2.3) nie został wdrożony.
- Naprawa: dodać realnego autora lub recenzenta (Person + jobTitle + sameAs). W artykułach prawnych i podatkowych dodać „Zweryfikował: radca prawny / doradca podatkowy”. Utworzyć /o-nas i /blog/autor/<slug>. Wymaga obsługi Person w `page.tsx:163` i pola `reviewer` w `features/blog/types.ts`.

**3. Najważniejsza strona w GSC ma najsłabszą metodologię**
- Dowód: `/blog/rynek-pracy/najlepiej-platne-zawody` (6 946 wyświetleń, poz. 8, CTR 0,94%):
  - podaje „Mediana: 25 000–55 000 PLN”, czyli medianę jako przedział;
  - medycyna i lotnictwo to „szacunki rynkowe z praktyki branżowej” bez źródła;
  - błędy: „300–700 PLN za wizytę” w akapicie o stawkach godzinowych, „z Niemczech”, „z szpitalami”, literówka „mediananami” w meta description.
- Naprawa: pojedyncze mediany z GUS „Struktura wynagrodzeń wg zawodów” lub NoFluffJobs z datą. Widełki opisać jako „widełki”. Poprawić błędy, dodać autora.

**4. Cienkie treści YMYL bez źródeł urzędowych**
- Dowód: 15 z 26 artykułów prawno-finansowych ma <800 słów, 9 nie ma żadnego źródła gov.pl/ISAP/ZUS. Przykłady: `mobbing-w-pracy` (638 słów, tylko lexlege), `zwolnienie-dyscyplinarne`, `wypowiedzenie-umowy-o-prace`, `wypowiedzenie-zmieniajace`, `urlop-bezplatny`, `zwolnienie-grupowe`. W całym blogu 60/127 artykułów ma <800 słów, tylko 6 ma ≥1500.
- Naprawa: według wzorca `nadgodziny-wynagrodzenie` / `zwolnienie-lekarskie-l4` linkować każdy przepis do ISAP i dodać „Stan prawny na …”. W mobbingu odnotować trwające prace nad nowelizacją art. 94³ KP (status do weryfikacji).

**5. Ślady masowej produkcji**
- Dowód:
  - szablonowy akapit „Zanim uznasz którykolwiek z tych zawodów za pewny wybór, sprawdź go lokalnie. [zawody] – to zawody…” w 6 artykułach `rynek-pracy-*` (HR, farmacja, marketing, produkcja, ubezpieczenia, administracja), zdanie po kropce zaczyna się małą literą („farmaceuci i technicy…”);
  - 33 publikacje w sierpniu;
  - 92/127 dat aktualizacji przypada na 3 dni (44× 22.09). Commit 48caac34 pokazuje, że „aktualizacja” 22.09 była w dużej mierze kosmetyczna (usunięcie H1, linki, jedno zdanie), np. `cv-managera`;
  - tik „konkretn*” ok. 5×/1000 słów (629 wystąpień).
- Naprawa: usunąć lub przepisać wstawki slotowe. `updatedAt` zmieniać tylko przy zmianie merytorycznej. Dodać elementy unikalne: dane z platformy (zanonimizowane widełki z analiz rynku), cytaty praktyków, przykłady CV przed i po.

### ŚREDNIE

**6. Statystyki bez źródeł**
- Dowód: 238 liczb procentowych w blogu. 22 artykuły podają % bez żadnego linku zewnętrznego. Przykłady: „7 sekund”, „W 80% przypadków” (`cv`, `cv-do-pracy`), „przeciętny Polak zmienia branżę 2–3 razy”. 81% w `syndrom-oszusta` pochodzi z bloga konkurencji (interviewme.pl).
- Naprawa: zlinkować źródło pierwotne albo usunąć liczbę.

**7. Ranking z Vocare na 1. miejscu bez metodologii i bez ujawnienia**
- Dowód: `/blog/cv/kreator-cv` stawia Vocare na 1. miejscu, ceny konkurencji („~45 zł/mies.”) bez daty i źródła, błąd „Zanim zainstaluj”.
- Naprawa: dodać ujawnienie („to nasz produkt”), kryteria, datę sprawdzenia cen.

**8. CTA niedopasowane do tematu**
- Dowód: kategoria `praca` → promo „Zrób CV za darmo” także w mobbingu, L4 i zwolnieniu dyscyplinarnym (`features/marketing/constants/promo.ts`, `PROMO_BY_BLOG_CATEGORY.praca = 'cv'`).
- Naprawa: wariant per tag lub per artykuł (np. kalkulator dla tematów płacowych, doradca kariery dla tematów zwolnień).

**9. Nieweryfikowalne liczby na stronie głównej**
- Dowód: „99% Dopasowania”, „1200+ Zadowolonych użytkowników”, „CV w 100% odporne na ATS”.
- Naprawa: podać metodologię albo złagodzić sformułowania.

**10. On-page na stronach pozablogowych**
- Dowód:
  - H1 bez słów kluczowych: /blog „Odkryj swój  potencjał z Vocare” (podwójna spacja), /pricing „Plan dopasowany pod Ciebie”, /assistant „Nie szukaj pracy, Zaplanuj…”;
  - nieregularne wielkie litery: „Zaplanuj całą Swoją Karierę”, „Od celu do Konkretnych Kroków”;
  - brak JSON-LD na /pricing, /salary-calculator i stronach produktów;
  - 99/127 tytułów artykułów >60 znaków z sufiksem „| Vocare”;
  - 0 obrazów inline w blogu.
- Naprawa: H1 z frazą („Kalkulator wynagrodzeń brutto-netto 2026”, „Blog o karierze, CV i rynku pracy”). Dodać WebApplication na kalkulator, Product/Offer na cennik i FAQPage na stronach z FAQ. Skrócić tytuły. Dodać grafiki lub zrzuty do topowych 20 artykułów.

### NISKIE

**11. Szablonowe meta description**
- Dowód: 116/127 opisów zawiera „Sprawdź”, 120/127 zaczyna się pytaniem. Narzędzie nie flaguje tego jako template, ale wzorzec w SERP jest monotonny.
- Naprawa: zróżnicować otwarcia w top 30 stronach GSC.

**12. Kanibalizacja**
- Szczegóły w raporcie klastrów. Wspierające dowody z treści: H2 `doradca-zawodowy` i `doradztwo-zawodowe` pokrywają te same sekcje (koszt, sesja, coach/headhunter, wybór doradcy). Rdzeń CV (`cv`, `jak-zrobic-cv`, `cv-do-pracy`, `profesjonalne-cv`) jest nierozstrzygnięty od planu z 22.09 (Faza 4).

## Dane JSON (audit-data.json, kategoria Content Quality)

```json
{"category":"Content Quality","score":56,"onpage_score":74,"eeat":{"experience":30,"expertise":45,"authoritativeness":35,"trustworthiness":55,"weighted":43},"ai_citation_readiness":70,
"metadata_template":{"site_risk":"low","templated_ratio":0.0,"shared_cta_phrases":{}},
"findings":[
{"id":"free-claim-vs-pricing","severity":"critical","url":"/blog/cv/darmowy-kreator-cv"},
{"id":"no-named-authors-ymyl","severity":"high","file":"frontend/app/blog/[category]/[slug]/page.tsx:163"},
{"id":"top-page-salary-methodology","severity":"high","url":"/blog/rynek-pracy/najlepiej-platne-zawody"},
{"id":"thin-unsourced-legal","severity":"high","count":"15/26 <800w, 9 bez źródła urzędowego"},
{"id":"mass-production-signals","severity":"high","evidence":"slot paragraph x6, 44 updatedAt 2026-09-22"},
{"id":"unsourced-stats","severity":"medium","count":22},
{"id":"self-ranking-no-disclosure","severity":"medium","url":"/blog/cv/kreator-cv"},
{"id":"cta-mismatch-praca","severity":"medium","file":"frontend/features/marketing/constants/promo.ts"},
{"id":"homepage-unverifiable-claims","severity":"medium"},
{"id":"onpage-h1-schema-titles","severity":"medium"},
{"id":"description-pattern","severity":"low"}]}
```
