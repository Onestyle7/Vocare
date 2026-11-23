# Architektura treści i klastry tematyczne – blog vocare.pl

Data analizy: 2026-11-23 · Zakres: 127 opublikowanych artykułów z sitemap.xml (cv 35, praca 38, kariera 27, rynek-pracy 27) + 4 strony kategorii.
Źródła: sitemap.xml, pliki źródłowe artykułów (`frontend/features/blog/articles/*.md`, pełna analiza linków wewnętrznych), 2 artykuły pobrane na żywo (render: nagłówek, stopka, CTA, „Czytaj dalej”), 12 zapytań SERP.

> Zastrzeżenie metodologiczne: narzędzie wyszukiwania działa z indeksu US, więc wyniki dla polskich fraz zawierają szum (obce domeny, PDF-y). Liczby wspólnych URL-i to przybliżenie top 10 i należy je potwierdzić w Google.pl / GSC (raport „Strony” dla zapytania) przed wdrożeniem 301.

---

## 1. Mapa hub-and-spoke (stan obecny)

| Kategoria | Pillar (hub) | Spoke'y linkujące do pillara | Ocena |
|---|---|---|---|
| /blog/rynek-pracy | `/blog/rynek-pracy/rynek-pracy-w-polsce` (26 linków wych.) | 23/26 | Dobrze. Brakuje: brutto-netto-umowa-zlecenie, ile-na-reke-b2b, jawnosc-wynagrodzen |
| /blog/kariera | `/blog/kariera/sciezka-kariery` | 14/26 | Średnio |
| /blog/praca | `/blog/praca/jak-znalezc-prace` | 8/37 | Słabo. Klastry prawa pracy nie mają huba |
| /blog/cv | `/blog/cv/cv` | 9/34 | Słabo. Sygnał huba rozbity na cv / jak-zrobic-cv / profesjonalne-cv / cv-wzor |

### Docelowe klastry (proponowane)

**CV – pillar `/blog/cv/cv`**
- A. Tworzenie CV: cv-wzor, przykladowe-cv (sub-hub CV zawodowych), profesjonalne-cv, cv-do-pracy (po przeprofilowaniu na dopasowanie do oferty), kreator-cv
- B. Sekcje CV: umiejetnosci-do-cv, zainteresowania-w-cv, zdjecie-do-cv, klauzula-rodo-do-cv, referencje-zawodowe
- C. CV wg zawodu/sytuacji (hub: przykladowe-cv): cv-bez-doswiadczenia, cv-studenta, cv-programisty, cv-analityka-danych, cv-inzyniera, cv-managera, cv-nauczyciela, cv-prawnika, cv-w-medycynie, cv-freelancera
- D. CV zagraniczne (hub: cv-po-angielsku): cv-po-niemiecku, cv-po-francusku, cv-po-hiszpansku, europass-cv
- E. List motywacyjny (hub: list-motywacyjny): wzor-listu-motywacyjnego, list-motywacyjny-po-angielsku
- F. Marka kandydata: linkedin-profil, portfolio-zawodowe, cv-wideo

**Praca – pillar `/blog/praca/jak-znalezc-prace`**
- A. Szukanie pracy: gdzie-szukac-pracy, praca-bez-doswiadczenia, praca-dla-studenta, praca-sezonowa-za-granica, praca-dla-osob-niepelnosprawnych, executive-search-headhunting
- B. Rekrutacja (hub: rozmowa-kwalifikacyjna): pytania-na-rozmowie-kwalifikacyjnej, assessment-center, negocjacje-wynagrodzenia, onboarding-nowa-praca, badania-lekarskie-do-pracy, szkolenie-bhp-wstepne
- C. Model pracy (hub: praca-zdalna): praca-hybrydowa, czas-pracy-elastyczny, praca-zdalna-dla-zagranicznego-pracodawcy
- D. Umowy i wynagrodzenia (hub: umowa-o-prace-vs-b2b, 12 linków wych.): umowa-o-dzielo, umowa-na-czas-okreslony-limit, nadgodziny-wynagrodzenie, praca-w-niedziele-i-swieta, delegacja-sluzbowa + cross-kategoria: brutto-netto-umowa-zlecenie, ile-na-reke-b2b, jawnosc-wynagrodzen → **/salary-calculator**
- E. Urlopy i nieobecności (hub: urlop-wypoczynkowy): urlop-bezplatny, urlop-macierzynski-rodzicielski, urlop-ojcowski, zwolnienie-lekarskie-l4, (kariera) powrot-do-pracy-po-macierzynskim
- F. Koniec zatrudnienia (hub: wypowiedzenie-umowy-o-prace): jak-zrezygnowac-z-pracy, wypowiedzenie-zmieniajace, zwolnienie-dyscyplinarne, zwolnienie-grupowe, odprawa-emerytalna, zasilek-dla-bezrobotnych
- G. Prawa pracownika: mobbing-w-pracy, kontrola-trzezwosci-w-pracy → brak pillara „Prawa pracownika 2026” (luka, p. sekcja 4)

**Kariera – pillar `/blog/kariera/sciezka-kariery`**
- A. Wybór zawodu (hub: jaki-zawod-wybrac): test-kariery-online, test-kompetencji-zawodowych, doradca-zawodowy (+ cross: zawody-przyszlosci-2026, najlepiej-platne-zawody) → **/assistant**
- B. Rozwój (hub: plan-rozwoju-zawodowego): awans-zawodowy, mentoring-zawodowy, networking-zawodowy, budowanie-marki-osobistej, mba-czy-certyfikaty, kompetencje-miekkie-jak-rozwijac, inteligencja-emocjonalna-w-pracy, feedback-w-pracy, asertywnosc-w-pracy → **/roadmap**
- C. Zmiana i kryzys (hub: jak-zmienic-branze): kariera-po-40-50, kryzys-polowy-kariery, wypalenie-zawodowe-co-dalej, urlop-od-kariery-sabbatical, portfolio-career, korporacja-czy-startup
- D. Efektywność: zarzadzanie-czasem, prokrastynacja-w-pracy, syndrom-oszusta

**Rynek pracy – pillar `/blog/rynek-pracy/rynek-pracy-w-polsce`**: 21 raportów branżowych + zawody-przyszlosci-2026, najlepiej-platne-zawody, jawnosc-wynagrodzen, brutto-netto-umowa-zlecenie, ile-na-reke-b2b → **/market-analysis**, **/salary-calculator**

---

## 2. Kanibalizacja – macierz SERP i rekomendacje

| Para fraz | Wspólne URL-e (top 10, ~) | Próg | Nakładanie on-page | Rekomendacja |
|---|---|---|---|---|
| „jak napisać cv” (/blog/cv/cv) vs „jak zrobić cv” (/blog/cv/jak-zrobic-cv) | ~7 (infor×2, zpe, zielonalinia, interia, xyz, uken) | ten sam post | oba celują w „jak napisać cv” (tagi) | **Scalić: 301 jak-zrobic-cv → /blog/cv/cv** (przenieść sekcje „narzędzia” i krok-po-kroku). Jeśli GSC pokaże, że jak-zrobic-cv ma lepsze pozycje – odwrócić kierunek |
| „jak zrobić cv” vs „cv do pracy” (/blog/cv/cv-do-pracy) | ~6-7 | ten sam post | meta description cv-do-pracy niemal identyczne z cv.md („Jak napisać CV… przejdzie przez ATS i trafi do rekrutera?”) | **Przeprofilować, nie scalać**: cv-do-pracy → „Jak dopasować CV do oferty pracy (słowa kluczowe z ogłoszenia)”; nowy title/description; łączy się z funkcją TailorCv |
| „cv wzór” (cv-wzor) vs „jak zrobić cv” | ~4 | klaster | intencja szablonowa | Zostawić, linkować do pillara |
| „profesjonalne cv” | – | – | tagi „jak napisać cv”, „cv do pracy”; 6 CV zawodowych linkuje do niego zamiast do pillara | Usunąć te tagi, skupić na wyglądzie/formacie; w CV zawodowych dodać link do /blog/cv/cv |
| „kreator cv” (kreator-cv) vs „darmowy kreator cv” (darmowy-kreator-cv) + **/resume-creator** (title „Kreator CV z AI i audytem ATS”) | ~3 (szum US) – oba SERP-y zdominowane przez narzędzia (transakcyjne) | interlink, ale 3 URL-e na 1 frazę | te same sekcje (Vocare, Google Docs, Canva, paywalle) | **301 darmowy-kreator-cv → /resume-creator** (FAQ „czy naprawdę za darmo” przenieść na landing; dodać „darmowy” do title/H1 – plan 0 zł istnieje). kreator-cv → „Ranking kreatorów CV 2026” (intencja porównawcza) |
| „list motywacyjny” vs „jak napisać list motywacyjny” | ~7 (zpe, clickup, olx, aplikuj×2, money, rp) | ten sam post | identyczna struktura (nagłówek + 4 akapity), wzajemne linki ×2 | **Scalić: 301 jak-napisac-list-motywacyjny → /blog/cv/list-motywacyjny** (przenieść „Przykład od początku do końca” i „3 pytania na rozgrzewkę”) |
| „jak napisać list” vs „wzór listu motywacyjnego” | ~5 | klaster | intencja szablonowa | Zostawić jako spoke |
| „doradca zawodowy” vs „doradztwo zawodowe” | ~3-4 (epale, samorzad, wuptorun) | interlink/klaster | ~70% sekcji wspólnych (koszt, sesja, doradca vs coach vs headhunter, jak wybrać); wzajemne linki 3-4×; doradztwo ma tylko 1 link przychodzący | **Scalić: 301 doradztwo-zawodowe → /blog/kariera/doradca-zawodowy** (przenieść „5 sytuacji” i „Czego doradztwo nie zrobi”); title: „Doradca zawodowy i doradztwo zawodowe 2026 – …” |
| „ścieżka kariery jak zaplanować” vs „plan rozwoju zawodowego” | ~2 | osobne | różne kąty | Zostawić, linkują się wzajemnie – OK |
| jak-zrezygnowac-z-pracy vs wypowiedzenie-umowy-o-prace | nie sprawdzano | – | tagi jak-zrezygnowac zawierają „wypowiedzenie umowy o pracę”, „okres wypowiedzenia” | Usunąć te tagi, dodać link do wypowiedzenie-umowy-o-prace |
| jak-znalezc-prace vs gdzie-szukac-pracy | nie sprawdzano | – | różne kąty, wzajemne linki | OK |

Przy każdym 301: wpis w `proxy.ts` (tam już są 308 dla starych kategorii), usunięcie pliku z sitemapy, podmiana linków wewnętrznych (darmowy-kreator-cv: 1, jak-zrobic-cv: ~8, jak-napisac-list: ~3, doradztwo: 4 z doradca-zawodowy).

---

## 3. Linki do huba i stron produktowych

**Linki w treści (pliki źródłowe):** 127/127 artykułów ma ≥1 link do produktu (razem 308): głównie /resume-creator, /assistant, /market-analysis, /roadmap.

Problemy:
1. **/salary-calculator** – linkowany w treści tylko z 2 artykułów (brutto-netto-umowa-zlecenie, ile-na-reke-b2b). Brak w: negocjacje-wynagrodzenia, umowa-o-prace-vs-b2b, umowa-o-dzielo, nadgodziny-wynagrodzenie, praca-w-niedziele-i-swieta, delegacja-sluzbowa, jawnosc-wynagrodzen, najlepiej-platne-zawody, praca-zdalna-dla-zagranicznego-pracodawcy, zwolnienie-lekarskie-l4, urlop-macierzynski-rodzicielski, odprawa-emerytalna, rynek-pracy-w-polsce, rynek-pracy-it (~15 artykułów).
2. **/pricing** – 0 linków w treści (jest w nagłówku/stopce i w CTA promo dla kariera/rynek-pracy). Akceptowalne.
3. **CTA przypisane do kategorii, nie tematu** (`features/blog/utils/constants.ts` → `CATEGORY_TOOL_CTA`, `features/marketing/constants/promo.ts` → `PROMO_BY_BLOG_CATEGORY`): wszystkie 38 artykułów /blog/praca dostają CTA „Otwórz kreator CV” / „Zrób CV za darmo” – również negocjacje wynagrodzenia, nadgodziny, urlopy, zwolnienia (potwierdzone na żywo na /blog/praca/negocjacje-wynagrodzenia). Wariant `salary` istnieje, ale blog go nie używa. Rekomendacja: pole frontmatter `promo:` z nadpisaniem per artykuł; artykuły płacowe → `salary` + /salary-calculator.
4. **Hub:** spoke'y CV zawodowe (10) nie linkują do /blog/cv/cv; 29/37 artykułów /blog/praca nie linkuje do jak-znalezc-prace. Kategoria jest linkowana przez breadcrumb/etykietę, ale to strona listingu, nie pillar.
5. **Słabo linkowane strony (≤2 linki przychodzące w treści):** darmowy-kreator-cv (1), doradztwo-zawodowe (1), mba-czy-certyfikaty, kryzys-polowy-kariery, executive-search-headhunting, praca-dla-osob-niepelnosprawnych, odprawa-emerytalna, rynek-pracy-rolnictwo (po 2). Bloki „Czytaj dalej” częściowo to kompensują.

---

## 4. Luki treściowe powiązane z produktem

| # | Temat / fraza | Klaster | Produkt |
|---|---|---|---|
| 1 | Sprawdzenie CV online / test CV pod ATS („jak sprawdzić CV”) | CV-A | Audyt CV (AnalyzeCv) → /resume-creator |
| 2 | System ATS – co to jest, jak działa, jak go przejść (osobny artykuł; dziś rozproszone) | CV-A | Audyt CV |
| 3 | Seria „Jak zostać [analitykiem danych / programistą / UX designerem / project managerem] w 12 miesięcy” | Kariera-B | /roadmap + /market-analysis |
| 4 | Zarobki wg stanowiska i poziomu („ile zarabia programista/junior/senior 2026”) – dziś są tylko raporty branżowe | Rynek pracy | /market-analysis + /salary-calculator |
| 5 | Luka kompetencyjna – jak sprawdzić, jakich umiejętności brakuje do awansu/zmiany | Kariera-B | /market-analysis (missing skills) |
| 6 | Przebranżowienie do IT 2026 – trudność wejścia, ścieżki | Kariera-C | /market-analysis (entry difficulty) + /roadmap |
| 7 | Doradca kariery AI vs doradca zawodowy – czy AI może pomóc wybrać zawód | Kariera-A | /assistant |
| 8 | Szukanie pracy z AI / dopasowanie ofert do profilu (szkic `_szukanie-pracy-w-dobie-ai.md` istnieje) | Praca-A | dopasowanie ofert (JobOffers) |
| 9 | Ukryty rynek pracy (szkic `_ukryty-rynek-pracy.md` istnieje) | Praca-A | /assistant |
| 10 | Pillar „Prawa pracownika / Kodeks pracy 2026” spinający ~20 artykułów prawnych | Praca D–G | /salary-calculator |

---

## 5. Priorytety wdrożenia

1. 301: jak-napisac-list-motywacyjny → list-motywacyjny; doradztwo-zawodowe → doradca-zawodowy; darmowy-kreator-cv → /resume-creator; jak-zrobic-cv → cv (po sprawdzeniu GSC).
2. Przeprofilować cv-do-pracy (dopasowanie do oferty), profesjonalne-cv (format), kreator-cv (ranking).
3. Linki do pillara we wszystkich spoke'ach CV i Praca; huby pośrednie (przykladowe-cv, cv-po-angielsku, rozmowa-kwalifikacyjna, umowa-o-prace-vs-b2b, urlop-wypoczynkowy, wypowiedzenie-umowy-o-prace).
4. /salary-calculator w ~15 artykułach płacowych + CTA per artykuł zamiast per kategoria.
5. Luki 1, 2, 3, 4 (największy związek z produktem płatnym).

---

## Dane strukturalne (audit-data.json → Content Architecture)

```json
{
  "category": "Content Architecture",
  "articles_analyzed": 127,
  "hubs": [
    {"category": "cv", "pillar": "/blog/cv/cv", "spokes": 34, "spokes_linking_to_pillar": 9},
    {"category": "praca", "pillar": "/blog/praca/jak-znalezc-prace", "spokes": 37, "spokes_linking_to_pillar": 8},
    {"category": "kariera", "pillar": "/blog/kariera/sciezka-kariery", "spokes": 26, "spokes_linking_to_pillar": 14},
    {"category": "rynek-pracy", "pillar": "/blog/rynek-pracy/rynek-pracy-w-polsce", "spokes": 26, "spokes_linking_to_pillar": 23}
  ],
  "serp_overlap": [
    {"a": "jak napisać cv", "b": "jak zrobić cv", "shared_top10": 7, "verdict": "same_post"},
    {"a": "jak zrobić cv", "b": "cv do pracy", "shared_top10": 6, "verdict": "same_post_or_retarget"},
    {"a": "jak zrobić cv", "b": "cv wzór", "shared_top10": 4, "verdict": "same_cluster"},
    {"a": "kreator cv", "b": "darmowy kreator cv", "shared_top10": 3, "verdict": "interlink_noisy_transactional"},
    {"a": "list motywacyjny", "b": "jak napisać list motywacyjny", "shared_top10": 7, "verdict": "same_post"},
    {"a": "jak napisać list motywacyjny", "b": "wzór listu motywacyjnego", "shared_top10": 5, "verdict": "same_cluster"},
    {"a": "doradca zawodowy", "b": "doradztwo zawodowe", "shared_top10": 3, "verdict": "interlink_but_content_duplicate"},
    {"a": "ścieżka kariery jak zaplanować", "b": "plan rozwoju zawodowego", "shared_top10": 2, "verdict": "separate"}
  ],
  "redirects_recommended": [
    {"from": "/blog/cv/jak-napisac-list-motywacyjny", "to": "/blog/cv/list-motywacyjny", "priority": "high"},
    {"from": "/blog/kariera/doradztwo-zawodowe", "to": "/blog/kariera/doradca-zawodowy", "priority": "high"},
    {"from": "/blog/cv/darmowy-kreator-cv", "to": "/resume-creator", "priority": "high"},
    {"from": "/blog/cv/jak-zrobic-cv", "to": "/blog/cv/cv", "priority": "medium", "condition": "verify in GSC"}
  ],
  "retarget": ["/blog/cv/cv-do-pracy", "/blog/cv/profesjonalne-cv", "/blog/cv/kreator-cv", "/blog/praca/jak-zrezygnowac-z-pracy"],
  "product_links": {
    "articles_with_product_link": 127,
    "salary_calculator_in_body": 2,
    "pricing_in_body": 0,
    "cta_mismatch": "praca category (38 articles) always gets CV CTA, incl. salary/labour-law topics"
  },
  "content_gaps": 10
}
```
