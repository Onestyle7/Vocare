# Plan poprawkowy bloga Vocare

**Data:** 2026-09-22
**Podstawa:** [blog-audit-2026-09-22.md](blog-audit-2026-09-22.md) — 123 opublikowane posty, średnia 75.9/100
**Cel:** 75.9 → ~86/100 bez powiększania korpusu

---

## Zasada porządkowania

Audyt pokazał jedną rzecz jasno: **problemy inżynieryjne są już prawie rozwiązane, a problemy redakcyjne nie ruszyły z miejsca.**
Porównanie z audytem z 2026-09-02: sierpniowe 35 sierot → 0, brak schematów → 123 posty ze schematem, ale „brak zróżnicowanych
dowodów" poszło z 35/35 na **73/123**. Każdy problem, który dało się naprawić zmianą w kodzie, został naprawiony. Ten jeden
został, bo wymaga pracy redakcyjnej post po poście.

Dlatego plan jest ułożony tak: **najpierw domykamy resztki długu technicznego (bo to godziny, nie tygodnie), potem cała energia
idzie w źródła i głębokość.**

---

## Faza 0 — Quick wins (1–2 h, do zrobienia od razu)

Trzy zmiany, każda poniżej godziny, łącznie dotykają 123 postów.

### 0.1 Usunąć nagłówek `# ` ze 121 plików — WYSOKI

**Problem jest poważniejszy niż opisano w audycie.** Trasa renderuje `<h1>{metadata.title}</h1>`
([page.tsx:144](../frontend/app/blog/[category]/[slug]/page.tsx#L144)), a mapa komponentów mapuje markdownowe `#` na prawdziwy
`<h1>` ([page.tsx:179](../frontend/app/blog/[category]/[slug]/page.tsx#L179) → `MarkdownComponents.tsx:27`). W 121 plikach `# `
stoi tuż pod frontmatterem.

Efekt: **czytelnik widzi tytuł dwa razy pod rząd, w dwóch różnych brzmieniach**, przedzielony tylko okładką. Przykład
`doradztwo-zawodowe.md`:

- `<h1>` z trasy: „Doradztwo zawodowe 2026 - czym jest i kiedy skorzystać"
- `<h1>` z markdown (linia 21): „Doradztwo zawodowe 2026 - kiedy naprawdę warto skorzystać"

To jednocześnie błąd SEO (dwa H1) i widoczny błąd UX.

**Rekomendacja: usunąć linię `# ` z plików**, a nie mapować `h1` na `H2`. Mapowanie na `H2` usuwa duplikat H1, ale zostawia
podwójny tytuł na ekranie. Usunięcie linii naprawia obie rzeczy.

```bash
# usuwa pierwszy nagłówek '# ' wraz z następującą pustą linią
for f in frontend/features/blog/articles/*.md; do
  python - "$f" <<'EOF'
import sys, io, re
p = sys.argv[1]
t = io.open(p, encoding='utf-8').read()
t2 = re.sub(r'(\n---\n\n)# [^\n]*\n\n', r'\1', t, count=1)
if t2 != t:
    io.open(p, 'w', encoding='utf-8').write(t2)
EOF
done
```

Po uruchomieniu zweryfikować: `grep -c "^# " frontend/features/blog/articles/*.md | grep -v ":0$" | wc -l` powinno dać `0`.

> **Uwaga:** brzmienie H1 z markdown bywa lepsze niż `title` z frontmattera (częściej zawiera intencję: „kiedy naprawdę warto").
> Przed skasowaniem warto przejrzeć te warianty — w części postów lepszym ruchem jest przeniesienie tekstu H1 do `title`,
> a dopiero potem usunięcie linii.

### 0.2 Naprawić `lastModified` w sitemapie — WYSOKI

[sitemap.ts:39](../frontend/app/sitemap.ts#L39) ustawia `lastModified: article.date` (data publikacji), podczas gdy JSON-LD
na tej samej stronie ustawia `dateModified: metadata.updatedAt ?? metadata.date`. 53 posty mają `updatedAt: 2026-09-*`.

Google widzi więc `lastmod` starszy o miesiące od `dateModified` strony — dokładnie dla tych postów, które właśnie odświeżono.

```ts
lastModified: article.updatedAt ?? article.date,
```

Przy okazji: trasy statyczne w tym samym pliku nie mają `lastModified` w ogóle.

### 0.3 Poprawić ścieżkę w README

[app/blog/README.md](../frontend/app/blog/README.md) mówi, że artykuły leżą w `frontend/articles/`. Leżą w
`frontend/features/blog/articles/` (`constants.ts:1`).

**Rezultat Fazy 0:** dwa błędy wysokiego priorytetu zamknięte, 121 postów naprawionych, ~1–2 h pracy.

---

## Faza 1 — Dług techniczny (ok. 8–10 h, tydzień 1)

### 1.1 Huby kategorii — `/blog/<kategoria>` zwraca 404

`frontend/app/blog/[category]/` zawiera tylko podkatalog `[slug]/` — brak `page.tsx`. `/blog/CV`, `/blog/Job`, `/blog/Kariera`
i `/blog/rynek-pracy` to czwórka 404-ek, mimo że te segmenty występują w 123 kanonicznych URL-ach i w BreadcrumbList.

To **najbardziej opłacalna zmiana w linkowaniu wewnętrznym, jaka jest dostępna**. Dziś jedynym hubem jest `/blog`
(płaska siatka 123 kart bez paginacji). Cztery huby kategorii dadzą strukturę tam, gdzie jej nie ma.

Zakres: `page.tsx` + `generateStaticParams` + `generateMetadata` z kanonicznym `/blog/<kategoria>`, lista postów danej kategorii
(34 / 38 / 27 / 24 posty). Po dodaniu — rozszerzyć BreadcrumbList z 2 do 3 poziomów (Blog → Kategoria → Post).

**Szacunek: 2–3 h.**

### 1.2 Liczyć `estimatedReadTime` z treści

110 ze 123 postów zawyża czas czytania o ponad 2 minuty; **ani jeden nie zaniża**. Wartości to ręcznie wpisany szablon
(47 postów ma 7, 49 ma 8, 16 ma 9), a realna długość to średnio 760 słów, czyli ~4 minuty.

Najprostsze rozwiązanie bez migracji treści: liczyć w `getArticlesMetadata` i nadpisywać wartość z frontmattera
(pole w `articleSchema` zostaje dla kompatybilności).

```ts
const readTime = Math.max(1, Math.round(wordCount / 200)); // ~200 sł./min dla polskiego
```

**Uwaga strategiczna:** ta poprawka sama w sobie **uwidoczni czytelnikowi, jak krótkie są teksty** (karty zaczną pokazywać
3–4 min zamiast 8). Dlatego warto ją wdrożyć równolegle z Fazą 3, albo świadomie przyjąć, że przez jakiś czas blog będzie
uczciwie komunikował swoją obecną objętość.

**Szacunek: 30 min.**

### 1.3 Ujednolicić slugi kategorii

| Dziś | Postów | Propozycja |
|------|--------|-----------|
| `CV` | 34 | `cv` |
| `Job` | 38 | `praca` |
| `Kariera` | 27 | `kariera` |
| `rynek-pracy` | 24 | `rynek-pracy` |

Trzy konwencje wielkości liter i dwa języki (`Job` po angielsku na polskim serwisie). Ścieżki URL są case-sensitive, więc
`/blog/cv/...` i `/blog/CV/...` to różne adresy — każdy link z małej litery da 404.

Wymaga: zmiany `category` w 99 plikach + 301 w `next.config.ts` wg wzorca, który już tam jest (linie 38–62).
**Zrobić teraz, zanim korpus urośnie.**

**Szacunek: 2 h.**

### 1.4 Skrócić tytuły i opisy

- `app/layout.tsx:92-95` dokleja `" | Vocare"` (+9 znaków). **45 postów** ma `title` ≥ 61 znaków, więc renderowany `<title>`
  przekracza 70 znaków i zostanie obcięty. Rekordzista: `executive-search-headhunting` — 89 znaków.
- **15 opisów** przekracza 165 znaków (najdłuższy 180).

**Szacunek: 2 h.**

---

## Faza 2 — E-E-A-T (20–30 h, tygodnie 2–4) — **NAJWAŻNIEJSZA**

E-E-A-T to najsłabsza kategoria (7.6/15) i jednocześnie ta z największym zapasem. `eeat.trust` ma średnią **0.16/1** —
105 ze 123 postów ma tam zero.

### 2.1 Uźródłowić 10 postów prawnych — PRIORYTET

**To nie jest kwestia SEA, tylko odpowiedzialności.** Te artykuły podają ustawowe kwoty i wymiary bez żadnego źródła:

| Post | Statystyk | Uźródłowionych | Temat |
|------|-----------|----------------|-------|
| `delegacja-sluzbowa` | 14 | **0** | stawki diet (rozporządzenie MRPiPS) |
| `urlop-macierzynski-rodzicielski` | 13 | **0** | wymiary urlopów (Kodeks pracy) |
| `umowa-o-dzielo` | 7 | **0** | prawo/podatki |
| `praca-w-niedziele-i-swieta` | 4 | **0** | ograniczenia handlu |
| `zwolnienie-lekarskie-l4` | 3 | **0** | zasiłek chorobowy (ZUS) |
| `urlop-ojcowski` | 3 | **0** | wymiar urlopu |

### Wzorzec do skopiowania jest już w repo

**`nadgodziny-wynagrodzenie` ma 18 statystyk i wszystkie 18 uźródłowione** — to najlepiej udokumentowany post na całym blogu
i jedyny, który traktuje kwoty ustawowe poprawnie. **Nie trzeba wymyślać standardu, trzeba przenieść ten wzorzec na pozostałe
posty prawne.**

Pozostałe źródła już obecne w blogu: `isap.sejm.gov.pl` (4 linki), `lexlege.pl` (5), `zus.pl` (1).
Zasada: **każda kwota i każdy wymiar linkuje do ISAP / ZUS / gov.pl**, z datą stanu prawnego.

Trzy dalsze posty prawne — `odprawa-emerytalna`, `umowa-na-czas-okreslony-limit`, `zasilek-dla-bezrobotnych` — nie mają
wykrytych liczb w ogóle (542–715 słów, po 1 linku zewnętrznym). To nie znaczy, że są bezpieczne: opisują świadczenia
i limity **bez podawania konkretów**. Tutaj zadaniem nie jest uźródłowienie, tylko **uzupełnienie o konkretne kwoty
i wymiary — od razu ze źródłami.**

**Szacunek: 4–6 h.**

### 2.2 Uźródłowić 24 posty `rynek-pracy-*`

Największy blok bez źródeł. To teksty w całości oparte na danych (trendy, zarobki, deficyty) — a 10 z nich nie cytuje niczego.
W tym **`rynek-pracy-w-polsce`, najczęściej linkowany post na blogu (23 linki przychodzące), o polskim rynku pracy, bez
jednego źródła danych.**

Źródła: GUS (`stat.gov.pl`), Barometr Zawodów (`barometrzawodow.pl` — już używany 4×), NBP, Eurostat, raporty NoFluffJobs
dla IT.

**Szacunek: 8–12 h.** Najlepiej jako jeden skoncentrowany sprint, bo źródła się powtarzają między postami.

### 2.3 Prawdziwi autorzy zamiast `author: Vocare`

Wszystkie posty mają `author: Vocare`, a [page.tsx:100-106](../frontend/app/blog/[category]/[slug]/page.tsx#L100) emituje to
jako `{"@type": "Person", "name": "Vocare", "url": "/blog"}`. Firma nie jest osobą, a `/blog` nie jest stroną autora.
Analizator daje `eeat.author` pełne 4/4, bo pole jest wypełnione — ale dla E-E-A-T to sygnał pusty.

Do zrobienia:
- `author` → imię i nazwisko realnej osoby
- schema: `Person` + `jobTitle` + `sameAs` (LinkedIn)
- strony autorów pod `/blog/autor/<slug>` z biogramem i kompetencjami
- `Vocare` zostaje jako `publisher` typu `Organization` — tam jest na swoim miejscu

**Szacunek: 4–6 h.**

### 2.4 Uporządkować CTA

**286 linków do strony głównej `vocare.pl`, wszystkie z identycznym anchorem „Vocare.pl"** — 100% dokładnego dopasowania,
~2,3 na post. Do tego zapisane jako URL-e bezwzględne tam, gdzie należą się względne.

- zróżnicować anchor tekstowo i kontekstowo („darmowy kreator CV", „analiza profilu")
- linkować do konkretnych podstron produktu, nie zawsze do `/`
- zamienić `https://vocare.pl/...` na ścieżki względne

Efekt uboczny: przestanie zawyżać `external_count` w analizatorze (dziś post z 1 realnym źródłem raportuje 8 „linków
zewnętrznych").

**Szacunek: 3 h.**

---

## Faza 3 — Głębokość treści (40 h+, ciągłe, tygodnie 3–8)

Mediana długości to **641 słów**; 90 ze 123 postów ma poniżej 900. Polska czołówka SERP na frazy typu *cv wzór*,
*list motywacyjny*, *rozmowa kwalifikacyjna* to rutynowo 2000–3000 słów z szablonami do pobrania.

Dobra wiadomość: **szkielet jest już zrobiony dobrze** — TL;DR w 121/123, FAQ w 123/123, 7 nagłówków H2 średnio,
nagłówki dobrze zróżnicowane (powtarzają się tylko `Podsumowanie` i `Powiązane artykuły`). Brakuje treści w środku.

### 3.1 Rozbudowa 20 najsłabszych postów do 1200+ słów

Kolejka z audytu (sekcja „Lowest-scoring posts"). Zacząć od tych, które są jednocześnie cienkie i bez źródeł —
`portfolio-career` (660 sł.), `portfolio-zawodowe` (665 sł.), `praca-zdalna` (633 sł.), `praca-hybrydowa` (599 sł.).

### 3.2 Obrazy inline — dziś **zero w całym blogu**

README dokumentuje składnię `![Alt](/img.webp 'width=800 height=450')`, `getImageSizeFromTitle` ją implementuje, i **żaden
ze 123 postów jej nie używa.** Każdy post to ściana tekstu pod jedną okładką.

### 3.3 Okładki OG

34 okładki na 123 posty; `job-search.webp` użyty **19 razy**. `coverImage` jest jednocześnie `og:image` i `image` w schemacie,
więc 19 postów ma identyczny podgląd w social mediach. Osiem najczęściej powtarzanych okładek obsługuje 68 postów —
wygenerowanie osobnych dla 20 najważniejszych postów usuwa większość duplikacji.

### 3.4 Definicje encji

23 posty nie definiują żadnej encji (`ai.entity_clarity` 1.64/3). Wzorzec `**termin** to ...` w pierwszym akapicie sekcji.

---

## Faza 4 — Kanibalizacja (6–8 h) — **CZĘŚCIOWO ZABLOKOWANA**

> **Blokada:** wszystkie wnioski o kanibalizacji pochodzą z analizy treści, nie z danych o zapytaniach. **Przed jakimkolwiek
> scaleniem lub 301 trzeba potwierdzić nakładanie się w Search Console** (raport zapytanie → URL). Scalenie na podstawie
> samego podobieństwa tekstu może skasować stronę, która realnie rankuje na inną frazę.

Porządki z 2026-09-02 były dobre — cztery 301 w `next.config.ts:38-62`, wszystkie cele istnieją i mają zgodne kategorie.
Zostało:

| Klaster | Posty | Rekomendacja | Po GSC? |
|---------|-------|--------------|---------|
| **Doradztwo** | `doradca-zawodowy` (78) ↔ `doradztwo-zawodowe` (84) | Scalić lub mocno zróżnicować. Najwyższe podobieństwo na blogu (0.52), prawie identyczna długość, oba odpowiadają na „co to / ile kosztuje / czy warto". `doradztwo-zawodowe` jest mocniejszy. | **TAK** |
| **Portfolio** | `portfolio-zawodowe` (72) ↔ `portfolio-career` (71) | Zróżnicować pilnie. Oba cienkie i słabe, a `portfolio-career` to angielski termin na polskim serwisie opisujący inne pojęcie (praca na wielu projektach), czego tytuł nie komunikuje. | nie |
| **List motywacyjny** | `list-motywacyjny`, `jak-napisac-list-motywacyjny`, `wzor-listu-motywacyjnego` | Zróżnicować w treści. Tytuły już są rozdzielone (czy potrzebny / jak napisać / szablony) — trzeba to wyegzekwować w tekście. | nie |
| **CV core** | `cv`, `cv-do-pracy`, `cv-wzor`, `jak-zrobic-cv`, `przykladowe-cv`, `profesjonalne-cv` | Zróżnicować + skonsolidować. `profesjonalne-cv` (969 sł.) jest najsłabszy i nie ma odrębnej intencji — wchłonąć do `cv`. | **TAK** |

**Nie jest kanibalizacją:** 24 posty `rynek-pracy-*` mają wspólny szablon tytułu, ale każdy celuje w inną branżę.
Są zróżnicowane z założenia — ich problem to brak źródeł (Faza 2.2), nie duplikacja.

---

## Faza 5 — Pomiar (2–3 h, równolegle)

Audyt musiał pominąć: **Search Console, GA4, PageSpeed/CrUX, URL Inspection, status indeksacji** — brak poświadczeń
(`blog-google` nieskonfigurowane).

Bez tego nie wiadomo: które posty realnie rankują, gdzie jest kanibalizacja na poziomie zapytań, które treści tracą ruch,
jakie są Core Web Vitals. Konfiguracja odblokowuje Fazę 4 i pozwala mierzyć efekt Faz 0–3.

---

## Podsumowanie nakładów

| Faza | Zakres | Nakład | Priorytet |
|------|--------|--------|-----------|
| 0 | Quick wins (H1, sitemap, README) | **1–2 h** | natychmiast |
| 1 | Dług techniczny (huby, readTime, slugi, meta) | 8–10 h | tydzień 1 |
| 2 | E-E-A-T (źródła, autorzy, CTA) | 20–30 h | tygodnie 2–4 |
| 3 | Głębokość treści | 40 h+ | ciągłe |
| 4 | Kanibalizacja | 6–8 h | po GSC |
| 5 | Pomiar | 2–3 h | równolegle |

**Największy zwrot na godzinę: Faza 0 (2 h, naprawia 121 postów) i Faza 2.1 (5 h, zdejmuje ryzyko prawne).**

Jeśli budżet wystarczy tylko na jedno: **Faza 2 (E-E-A-T)**. To najsłabsza kategoria, największy zapas punktów i jedyny
obszar, którego nie da się naprawić zmianą w kodzie — więc im dłużej czeka, tym więcej postów obejmuje. Między audytem
wrześniowym a dzisiejszym urósł z 35 do 73 postów.

---

## Czego ten plan nie obejmuje

- **Nowych treści.** Plan zakłada podniesienie jakości istniejących 123 postów, nie powiększanie korpusu. Przy medianie
  641 słów i 40% postów bez źródeł dopisywanie kolejnych tekstów pogłębi problem, zamiast go rozwiązać.
- **Decyzji o scaleniach** — te wymagają danych z GSC (Faza 5).
- **`llms.txt`** — `robots.ts` przepuszcza wszystkie boty (w tym GPTBot, ClaudeBot, PerplexityBot, Google-Extended),
  blokuje tylko `/api/`. To poprawna postawa; `llms.txt` byłby dodatkiem, nie naprawą.
- **Trzech szkiców `_`-prefiksowanych** (`_doradca-finansowy-kiedy-skorzystac` 44, `_ukryty-rynek-pracy` 48,
  `_szukanie-pracy-w-dobie-ai` 54). Albo dokończyć, albo skasować — dziś leżą w repo bez ścieżki do publikacji.
