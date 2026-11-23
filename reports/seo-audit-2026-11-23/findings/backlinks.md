# Profil linków zwrotnych: vocare.pl

Tier danych: 0 (Common Crawl + crawler weryfikacyjny). Brak kluczy Moz, Bing i DataForSEO.

## Wynik

**Backlink Health Score: INSUFFICIENT DATA.** Mniej niż 4 czynniki punktacji mają dane, więc nie podajemy liczby. Jakakolwiek liczba byłaby myląca.

## Dane Common Crawl (poziom domeny, confidence: 0.50)

Wydanie grafu: `cc-main-2026-jan-feb-mar`. Dane z cache lokalnego z 2026-10-26. Grafy Common Crawl są kwartalne.

| Metryka | Wartość | Ocena |
|---|---|---|
| Obecność w crawlu (host/domain graph) | NIE | warn |
| Obecność w rankingach | NIE | warn |
| PageRank / ranga PageRank | brak | n/d |
| Harmonic centrality / ranga | brak | n/d |
| Liczba hostów | brak | n/d |

Interpretacja: vocare.pl nie występuje w grafie z Q1 2026. Najbardziej prawdopodobne wyjaśnienia to młoda domena, mała liczba linków przychodzących lub niepełne pokrycie crawla. Brak w grafie nie dowodzi, że linków nie ma. Dowodzi tylko, że domena nie przekroczyła progu widoczności w tym wydaniu.

## Domeny odsyłające, anchory, toksyczność

- Domeny odsyłające: **brak danych**. Common Crawl nie podaje listy referring domains.
- Wzorce anchor textu: **brak danych**. Wymaga Moz, DataForSEO lub eksportu z Bing/GSC.
- Spam / toksyczność, dofollow/nofollow, geografia, velocity: **brak danych**.
- Crawler weryfikacyjny nie został uruchomiony, bo nie podano listy znanych linków do sprawdzenia.

Czynniki pominięte (wszystkie 7): liczba domen odsyłających, jakość domen, naturalność anchorów, współczynnik toksycznych, velocity, follow/nofollow, geografia.

## Ograniczenia danych

1. Jedno źródło, domenowe, confidence 0.50.
2. Wydanie Q1 2026, a dziś jest 2026-11-23, więc dane mogą być nieaktualne o 8+ miesięcy.
3. Nie da się ocenić jakości ani liczby linków.
4. Brak danych nie oznacza zera linków.

## Zalecenia

**Krytyczne / wysokie**
1. Podpiąć Google Search Console (raport Linki) oraz Bing Webmaster Tools. Oba są darmowe i dadzą realną listę domen odsyłających. Opcjonalnie darmowy klucz Moz (2 500 wierszy/mies.).
2. Po zebraniu eksportu GSC uruchomić `/seo backlinks verify` na liście linków i powtórzyć analizę.

**Taktyki link-buildingu dla polskiego SaaS karierowego**
1. **Kalkulator wynagrodzeń jako linkable asset** (wysoki priorytet). Narzędzie typu "ile powinienem zarabiać na stanowisku X", z osadzanym widżetem i atrybucją. Cele: portale HR, blogi o karierze, fora branżowe.
2. **Raporty danych z funkcji market-analysis** (wysoki). Kwartalny "Rynek pracy IT w Polsce": widełki, luki kompetencyjne, popyt na role. Rozsyłać do dziennikarzy jako dane oryginalne. Dane z ofert (SolidJobs) i analiz AI dają unikalny kąt.
3. **PR do polskich mediów HR i kariery** (średni): HR Standard, Pracuj.pl Aktualności, Bankier.pl, Antyweb, Spider's Web, Business Insider Polska, Wirtualne Media. Warto dodać platformy ekspertów typu Zawodowcy i serwisy Dziennik Gazeta Prawna (sekcja kariera).
4. **Biura karier uczelni** (średni, dobre jakościowo): polityki karier na politechnikach i uniwersytetach, darmowe warsztaty "CV z AI" w zamian za link ze strony zasobów dla studentów. Linki z domen .edu.pl mają wysoką wiarygodność.
5. **Katalogi i recenzje narzędzi AI** (niski): Product Hunt, polskie katalogi startupów, zestawienia "narzędzia do CV". Zadbać o różnorodne anchory (marka, URL, nazwa narzędzia), nie same frazy kluczowe.
6. **Treści blogowe linkowalne** (niski): przewodniki typu "CV po polsku vs angielsku", szablony CV do pobrania, benchmarki wynagrodzeń.

**Zasada:** priorytet na linki redakcyjne i naturalne anchory brandowe. Unikać zakupu linków i sieci PBN.

Rekomendacja pokrewna: audyt treści i E-E-A-T przez `/seo content`, techniczny przez `/seo technical`.

## Walidacja

`validate_backlink_report.py`: PASS (0 błędów, 0 ostrzeżeń).

---

## Aktualizacja 2026-11-23: dane z Google Search Console (eksport „Linki”)

Źródło: eksport GSC „Top linking text” (3 anchory) + „More sample links” (21 URL, 13 po usunięciu duplikatów `?tl=`). Weryfikacja: `verify_backlinks.py` (raw/verify-backlinks.json).

| Strona linkująca | Status | rel | Anchor | Wartość SEO |
|---|---|---|---|---|
| studenckiesprawy.pl (artykuł o CV/LinkedIn) | zweryfikowany | brak nofollow (dofollow) | Vocare.pl | **najcenniejszy** — redakcyjny, tematyczny |
| wykop.pl/link/7921223 | zweryfikowany | follow | vocare.pl | średnia (UGC, ale follow) |
| wykop.pl/ludzie/bartlomiej-klus | zweryfikowany | ugc | vocare.pl | niska |
| hotelbas.pl (zarobki hotelarza za granicą) | zweryfikowany | nofollow | przegląd pracy sezonowej za granicą | niska (ruch, nie moc) |
| reddit.com r/praca ×5, r/askcroatia ×1 | niezweryfikowalne (JS) | Reddit domyślnie nofollow/ugc | — | ruch + sygnał marki dla AI |
| linkedin.com/in ×3 (profile osobiste) | błąd pobrania (LinkedIn blokuje) | LinkedIn domyślnie nofollow | — | niska |

**Wnioski:**
- ~9 domen odsyłających, z czego tylko **2 przekazują moc** (studenckiesprawy.pl, wykop.pl). Profil bardzo młody, zgodny z brakiem w grafie Common Crawl.
- Anchory w 100% brandowe/URL lub naturalne — **zero ryzyka toksyczności**, nic do disavow.
- Reddit r/praca to realny kanał (5 wątków) — ważny dla widoczności w ChatGPT/Perplexity, które cytują Reddit.
- Linki kierują na stronę główną; żaden na kalkulator, kreator czy artykuły — brak linków do stron, które mają rankować.

**Backlink Health Score:** nadal bez liczby (brak metryk autorytetu domen), ocena jakościowa: **czysty, ale bardzo cienki profil**.
