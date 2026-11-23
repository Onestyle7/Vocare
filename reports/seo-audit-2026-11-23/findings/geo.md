# GEO / AI Search Readiness - vocare.pl

Data audytu: 2026-11-23. Próbka: strona główna, /blog, /pricing, /salary-calculator, robots.txt, sitemap.xml (141 URL, 131 na blogu) oraz 4 artykuły: /blog/cv/jak-zrobic-cv, /blog/rynek-pracy/ile-na-reke-b2b, /blog/rynek-pracy/najlepiej-platne-zawody, /blog/praca/jak-znalezc-prace.

## Wynik AI Search Readiness: 60/100

| Wymiar | Waga | Wynik | Ważony |
|---|---|---|---|
| Cytowalność (passage-level) | 25% | 62 | 15,5 |
| Czytelność strukturalna | 20% | 72 | 14,4 |
| Treści multimodalne | 15% | 45 | 6,8 |
| Autorytet i sygnały marki | 20% | 30 | 6,0 |
| Dostępność techniczna | 20% | 88 | 17,6 |
| **Razem** | | | **60** |

### Wyniki per platforma (szacunek)

| Platforma | Wynik | Główny czynnik ograniczający |
|---|---|---|
| Google AI Overviews / AI Mode | 62 | Dobra struktura i SSR; słaby E-E-A-T (brak autorów-osób, brak "O nas") przy tematach YMYL (podatki, wynagrodzenia) |
| ChatGPT Search | 50 | Słaba encja marki i brak wzmianek zewnętrznych; kolizja nazwy z Vocare (UK, NHS) |
| Perplexity | 60 | Lubi tabele, świeże daty i źródła - artykuł B2B to wzorzec; reszta bloga słabiej |
| Bing Copilot | 52 | Indeksacja w Bing niezweryfikowana; brak IndexNow; słaba encja |

## Dostęp crawlerów AI

robots.txt (generowany przez `frontend/app/robots.ts`): `User-Agent: *` / `Allow: /` / `Disallow: /api/`. Brak reguł per bot, więc wszystkie boty są dopuszczone.

Test curl z UA botów (strona główna + /blog/cv/jak-zrobic-cv): każdy UA dostał HTTP 200 i identyczny rozmiar odpowiedzi jak przeglądarka (150 382 B / 221 602 B). Nie widać blokady Vercel Firewall/WAF opartej na UA.

| Bot | Do czego służy | robots.txt | Test HTTP |
|---|---|---|---|
| OAI-SearchBot | Cytowania w ChatGPT Search | dozwolony | 200 |
| ChatGPT-User | Pobieranie stron na żądanie użytkownika ChatGPT | dozwolony | 200 |
| GPTBot | Trening modeli OpenAI (nie wpływa na ChatGPT Search) | dozwolony | 200 |
| Claude-SearchBot | Cytowania w wyszukiwaniu Claude | dozwolony | 200 |
| ClaudeBot | Trening modeli Anthropic (nie wyszukiwanie) | dozwolony | 200 |
| PerplexityBot | Indeks Perplexity | dozwolony | 200 |
| Google-Extended | Token robots.txt: trening/grounding Gemini i Vertex; NIE wpływa na Google Search ani AI Overviews (te zależą od Googlebota) | dozwolony | nie dotyczy (to token robots.txt, nie osobny crawler; test UA nic nie mówi) |
| Googlebot | Google Search + AI Overviews | dozwolony | 200 |
| bingbot | Bing + Copilot (i pośrednio część ChatGPT) | dozwolony | 200 |
| CCBot | Common Crawl (trening) | dozwolony | 200 |

Zastrzeżenie: test z podmienionym UA nie sprawdza reguł weryfikujących IP (np. Vercel Bot Protection / managed ruleset "AI Bots"). Potwierdź w Vercel -> Firewall, że ruleset AI Bots jest wyłączony lub ustawiony na "log", i zobacz w logach, czy realne żądania OAI-SearchBot/PerplexityBot dostają 200.

Dopuszczenie botów treningowych (GPTBot, ClaudeBot, CCBot, Google-Extended) to decyzja biznesowa. Dla małej, nowej marki raczej pomaga, bo modele "poznają" encję Vocare. Nie ma potrzeby zmiany.

## llms.txt i RSL

- /llms.txt: 404. Niski priorytet: Google go ignoruje, a inni dostawcy nie dają realnych dowodów, że z niego korzystają. Możesz go dodać za ok. 1 h (lista kategorii bloga + kluczowe narzędzia), ale niczego to nie odblokuje.
- RSL 1.0 (/license.xml): 404. Nie dotyczy, chyba że planujesz licencjonowanie treści.

## Ustalenia (wg wagi)

### WYSOKA-1. Brak strony "O nas" i słaba definicja encji marki
- Dowód: /o-nas, /about, /about-us, /kontakt, /o-vocare -> 404. W sitemap nie ma strony "o firmie". Schema Organization na stronie głównej (`features/marketing/utils/structuredData.ts`) ma tylko name, url, logo, email i sameAs (Instagram, LinkedIn, Facebook, TikTok). Brakuje description, founder, foundingDate, areaServed i knowsAbout. Pierwsze zdanie strony głównej ("Inteligentna platforma kariery, która prowadzi Cię...") nie zawiera nazwy Vocare ani słowa "Polska".
- Skutek: modele nie mają jednego, autorytatywnego źródła z odpowiedzią na pytanie "Czym jest Vocare?". Przy kolizji nazw (patrz WYSOKA-3) to krytyczne.
- Poprawka: dodaj stronę /o-nas zaczynającą się od zdania definicyjnego, np. "Vocare (vocare.pl) to polska platforma kariery oparta na AI: doradca zawodowy, analiza rynku pracy, roadmapa rozwoju i kreator CV." Dodaj na niej założyciela (Person), historię i kontakt. Rozbuduj Organization o `description`, `disambiguatingDescription` ("polska platforma kariery AI; niezwiązana z Vocare Ltd, UK"), `founder`, `foundingDate`, `areaServed: "PL"` i `knowsAbout`. Dodaj schema SoftwareApplication/WebApplication z `offers` na /pricing. Nakład: 0,5-1 dzień.

### WYSOKA-2. Autor = organizacja; brak ekspertów przy treściach YMYL
- Dowód: na każdym artykule widać "Autor: Vocare", w schema jest `author: {"@type":"Organization","name":"Vocare"}`, `article:author` = "Vocare". Artykuł o B2B podaje stawki ZUS, składki zdrowotnej i PIT bez osoby odpowiedzialnej i bez recenzji księgowego.
- Skutek: przy pytaniach finansowo-podatkowych AI Overviews i Perplexity wolą źródła z identyfikowalną ekspertyzą. To najsłabszy sygnał E-E-A-T.
- Poprawka: dodaj autora-osobę ze stroną bio (/autor/[slug]) i schema `Person` z `sameAs` na LinkedIn. Przy artykułach podatkowych i płacowych dodaj "Zweryfikowane przez: [księgowy/doradca podatkowy]" i `reviewedBy`. Nakład: 1-2 dni + bieżąco.

### WYSOKA-3. Kolizja nazwy i brak sygnałów marki poza stroną
- Dowód: Wikipedia EN ma artykuł "Vocare" o brytyjskim dostawcy usług out-of-hours dla NHS (Newcastle). Wikidata ma Q39086452 "Vocare - Healthcare provider based in the UK". "Vocare" to też łacińskie słowo ("wołać"), np. list papieski "Vocare peccatores". Brak hasła Wikipedia/Wikidata dla vocare.pl. Kanały YouTube @vocare.pl i @vocarepl -> 404, a w sameAs nie ma YouTube. Wyszukiwarki z narzędzi (Bing/DDG/Mojeek) były zablokowane lub zwracały śmieci, więc nie udało się wiarygodnie potwierdzić wzmianek na Reddit, w prasie ani w katalogach. Ten obszar trzeba sprawdzić ręcznie (Google: "vocare.pl" -site:vocare.pl).
- Skutek: wzmianki na YouTube (~0,74 korelacji z cytowaniami AI), Reddicie i w Wikipedii to najsilniejsze predyktory cytowań. Przy braku tych sygnałów modele mogą mylić Vocare z marką brytyjską albo po prostu jej nie znać.
- Poprawka: (a) kanał YouTube z krótkimi materiałami ("ile na rękę z B2B 2026", "jak zrobić CV") i linkiem w sameAs; (b) autentyczna obecność w r/Polska, r/praca, r/PolskaIT i podobnych (dane z kalkulatora, nie spam); (c) wpis w Wikidata (niższy próg niż Wikipedia) z P856 = vocare.pl i opisem odróżniającym; (d) PR danych, np. tabele B2B/UoP jako cytowalne zestawienie dla mediów biznesowych i HR; (e) profile w polskich katalogach narzędzi AI i SaaS. Nakład: na bieżąco, start w 1-2 tygodnie.

### ŚREDNIA-4. Większość artykułów nie zaczyna się od odpowiedzi
- Dowód: wzorcem jest /ile-na-reke-b2b, gdzie pierwsze 50 słów daje konkretną odpowiedź z liczbami ("Z faktury na 10 000 zł netto na B2B zostaje w 2026 roku od ok. 6 190 do 6 680 zł na rękę..."). Pozostałe próbki zaczynają się od "haczyka": /jak-zrobic-cv - "Czemu tak trudno zacząć pisać CV? Bo siada się do pustego dokumentu..."; /jak-znalezc-prace - "Wiesz już co chcesz robić. Masz CV. Przeglądasz Pracuj.pl codziennie. I nadal cisza."; /najlepiej-platne-zawody - "'Ile zarabia X?' to jedno z najczęściej wpisywanych zapytań w Google." Nagłówki H2 są w większości opisowe, nie pytające (wyjątki: "Jaki format CV wybrać?", "Czym różni się mediana od średniej?", "Ile czasu zajmuje znalezienie pracy?"). Mocne strony: blok "Najważniejsze wnioski" i sekcja FAQ z krótkimi odpowiedziami są w każdym artykule. To bardzo dobre, samodzielne fragmenty do cytowania.
- Poprawka: przepisz pierwsze 40-60 słów w ok. 30 artykułach o największym ruchu według wzoru B2B (odpowiedź, liczba, zakres/założenie). Zmień część H2 na pytania, np. "Jaki zawód zarabia najwięcej w Polsce w 2026?". Pod każdym H2 pierwsze zdanie powinno odpowiadać wprost. Nakład: 2-4 dni.

### ŚREDNIA-5. Statystyki bez źródeł i "mediana" jako widełki
- Dowód: /jak-znalezc-prace podaje "Polecenie konwertuje na rozmowę 30-40% przypadków, cold CV tylko 5-15%", "70% kandydatów nie wysyła follow-upów", "~30% follow-upów generuje odpowiedź" i "nawet 70% stanowisk nigdy nie trafia na portale". Artykuł nie ma żadnego linku zewnętrznego. /jak-zrobic-cv: "Format chronologiczny sprawdza się w 99% przypadków", bez źródła i bez linków zewnętrznych. /najlepiej-platne-zawody podpisuje zakresy jako mediany ("Mediana: 25 000 - 55 000 PLN"), choć mediana to jedna wartość. Ranking TOP 15 jest zrobiony nagłówkami H3, a nie tabelą. Sam artykuł uczciwie opisuje metodologię i linkuje GUS (stat.gov.pl) oraz NoFluffJobs, a meta description ma literówkę "mediananami". Wzorzec: /ile-na-reke-b2b ma 3 tabele, założenia i źródła (podatki.gov.pl, zus.pl).
- Skutek: LLM-y rzadziej cytują liczby bez atrybucji, a niespójność "mediana = zakres" obniża wiarygodność fragmentu.
- Poprawka: dodaj źródło przy każdej liczbie albo przeformułuj ją jako obserwację redakcji ("z naszego doświadczenia"). W rankingu zawodów dodaj tabelę (zawód | typowe widełki brutto | źródło | rok) i zmień "Mediana" na "Typowe widełki". Popraw literówkę w meta description. Drobna niespójność w B2B: lead mówi, że "od ok. 15 000 zł wygrywa ryczałt", a wnioski, że "powyżej ok. 12 000 zł". Tabela wskazuje próg między 12 a 15 tys., więc ujednolić. Nakład: 1-2 dni.

### ŚREDNIA-6. Słaba warstwa multimodalna
- Dowód: każdy artykuł ma ok. 6 obrazków (hero + elementy wspólne), w treści nie ma wykresów, wideo ani infografik. Tabele są tylko w B2B (3); w pozostałych 3 próbkach 0. Hero dla B2B to `job-portals.webp`, czyli obrazek z innego tematu, użyty ponownie także w schema `image`. Wyjątek na plus: w artykule B2B osadzony jest interaktywny kalkulator.
- Poprawka: dodaj tabelę porównawczą w każdym artykule z danymi (widełki, czasy, formaty CV). Dodaj 1 wykres lub infografikę z opisowym alt w kluczowych artykułach rynkowych. Osadź wideo z YouTube (łączy się z WYSOKA-3). Podmień hero w B2B. Nakład: 2-3 dni.

### NISKA-7. Niespójny LinkedIn i brak JSON-LD na stronach narzędzi
- Dowód: sameAs w Organization -> `linkedin.com/company/vocarepl/`, a stopka bloga (`features/marketing/constants/index.ts:386`) -> `linkedin.com/company/110046691`. /salary-calculator, /pricing i /blog mają 0 bloków JSON-LD.
- Poprawka: ujednolić URL LinkedIn do wersji z vanity slugiem. Dodać WebApplication na /salary-calculator, SoftwareApplication + Offer na /pricing oraz CollectionPage/ItemList na /blog. Nakład: 0,5 dnia.

### NISKA-8. Bing / IndexNow
- Indeksacja w Bing ma znaczenie dla Copilota i częściowo dla ChatGPT. Zweryfikuj vocare.pl w Bing Webmaster Tools, prześlij sitemap i dodaj ping IndexNow przy publikacji lub aktualizacji artykułu. Nakład: 1-2 h.

### NISKA-9. llms.txt
- 404. Opcjonalny, Google go ignoruje. Jeśli w ogóle, to po wszystkich punktach powyżej. Nakład: 1 h.

## Co działa dobrze (bez zmian)
- SSR/prerender: `X-Nextjs-Prerender: 1`, `X-Vercel-Cache: HIT`, is_spa=false. Cała treść jest w surowym HTML, a odpowiedź przychodzi w ok. 0,3 s.
- Daty: widoczne ("Opublikowano: 15 kwietnia 2026 | Zaktualizowano: 2 września 2026") i spójne z `datePublished`/`dateModified`, `article:*_time` i `lastmod` w sitemap.
- Schema BlogPosting + BreadcrumbList z `inLanguage: pl-PL`, `articleSection` i `keywords`.
- Bloki "Najważniejsze wnioski", FAQ i "Podsumowanie" w każdym artykule. Artykuły mają ok. 1 300-1 450 słów.
- /ile-na-reke-b2b to wzorcowy artykuł pod GEO: odpowiedź od razu, 3 tabele, założenia, ograniczenia ("Czego ta tabela nie uwzględnia?") i źródła rządowe.

## Top 5 zmian o największym wpływie

| # | Zmiana | Wpływ | Nakład |
|---|---|---|---|
| 1 | Strona /o-nas + rozbudowane Organization (disambiguatingDescription, founder, areaServed) + zdanie definicyjne na stronie głównej | Wysoki | 0,5-1 dzień |
| 2 | Autorzy-osoby + recenzja ekspercka (reviewedBy) w treściach podatkowych i płacowych | Wysoki | 1-2 dni + bieżąco |
| 3 | Off-site: YouTube, Reddit, Wikidata, PR danych z kalkulatora | Wysoki (długofalowo) | bieżąco |
| 4 | Leady answer-first i pytające H2 w ok. 30 artykułach o największym ruchu (wzór B2B) | Średni-wysoki | 2-4 dni |
| 5 | Źródła przy statystykach + tabele w artykułach z danymi (ranking zawodów) | Średni | 1-2 dni |

## Dane strukturalne (audit-data.json, kategoria "AI Search Readiness")

```json
{
  "category": "AI Search Readiness",
  "score": 60,
  "dimensions": {"citability": 62, "structural_readability": 72, "multimodal": 45, "authority_brand": 30, "technical_accessibility": 88},
  "platform_scores": {"google_aio": 62, "chatgpt_search": 50, "perplexity": 60, "bing_copilot": 52},
  "crawler_access": {"OAI-SearchBot": "allowed", "ChatGPT-User": "allowed", "GPTBot": "allowed", "Claude-SearchBot": "allowed", "ClaudeBot": "allowed", "PerplexityBot": "allowed", "Google-Extended": "allowed (robots token)", "Googlebot": "allowed", "bingbot": "allowed", "CCBot": "allowed", "waf_block_detected": false},
  "llms_txt": "missing (404, low priority)",
  "rsl_license": "missing (404)",
  "findings": [
    {"id": "geo-1", "severity": "high", "title": "Brak strony O nas i słaba definicja encji Vocare", "evidence": "/o-nas,/about,/kontakt -> 404; Organization bez description/founder/areaServed", "fix": "Strona /o-nas ze zdaniem definicyjnym; rozbudowa Organization z disambiguatingDescription", "effort": "0.5-1d"},
    {"id": "geo-2", "severity": "high", "title": "Autor = Organization, brak ekspertów w YMYL", "evidence": "author {@type: Organization, name: Vocare} we wszystkich artykułach", "fix": "Person authors + bio + reviewedBy (księgowy) dla treści podatkowych", "effort": "1-2d"},
    {"id": "geo-3", "severity": "high", "title": "Kolizja nazwy (Vocare UK/NHS w Wikipedii i Wikidata Q39086452) i brak sygnałów off-site", "evidence": "brak YouTube (@vocare.pl 404), brak Wikidata dla vocare.pl, brak potwierdzonych wzmianek zewnętrznych", "fix": "YouTube, Reddit, Wikidata, PR danych, sameAs", "effort": "ongoing"},
    {"id": "geo-4", "severity": "medium", "title": "Leady nie są answer-first (poza B2B)", "evidence": "jak-zrobic-cv, jak-znalezc-prace, najlepiej-platne-zawody zaczynają od haczyka", "fix": "Przepisać pierwsze 40-60 słów wg wzoru B2B; pytające H2", "effort": "2-4d"},
    {"id": "geo-5", "severity": "medium", "title": "Statystyki bez źródeł; zakresy podpisane jako mediana", "evidence": "jak-znalezc-prace: 70%, 30-40% bez linków zewnętrznych; zawody: 'Mediana: 25 000 - 55 000'", "fix": "Źródła przy liczbach, tabela rankingowa, 'Typowe widełki'", "effort": "1-2d"},
    {"id": "geo-6", "severity": "medium", "title": "Słaba warstwa multimodalna", "evidence": "0 tabel w 3/4 próbek, brak wideo/wykresów, hero B2B = job-portals.webp", "fix": "Tabele, wykresy, osadzone wideo, właściwy hero", "effort": "2-3d"},
    {"id": "geo-7", "severity": "low", "title": "Niespójny LinkedIn sameAs vs stopka; brak JSON-LD na /salary-calculator, /pricing, /blog", "evidence": "/company/vocarepl/ vs /company/110046691", "fix": "Ujednolicić URL; WebApplication/SoftwareApplication/CollectionPage", "effort": "0.5d"},
    {"id": "geo-8", "severity": "low", "title": "Bing Webmaster Tools / IndexNow niezweryfikowane", "evidence": "brak danych", "fix": "Weryfikacja BWT, sitemap, IndexNow", "effort": "1-2h"},
    {"id": "geo-9", "severity": "low", "title": "Brak llms.txt", "evidence": "/llms.txt -> 404", "fix": "Opcjonalnie dodać; Google ignoruje", "effort": "1h"}
  ]
}
```
