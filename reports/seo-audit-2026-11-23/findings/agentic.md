# Gotowość dla agentów AI — vocare.pl

Data kontroli: 2026-11-23. Fakty o standardach: vendor-matrix.md, ostatnia pełna weryfikacja 2026-09-23 (minęło ponad 60 dni, przed cytowaniem odświeżyć).

## Wynik Lighthouse Agentic Browsing

- Mobile: niedostępny. PSI zwróciło HTTP 429 (dzienny limit zapytań współdzielonego projektu, brak klucza API).
- Desktop: niedostępny, ten sam błąd.
- Wynik X/N: **nie wyznaczono**. Nie podaję liczby ani procentu. Aby go uzyskać, trzeba skonfigurować klucz Google API (`/seo google setup`) i powtórzyć `lighthouse_agentic.py --strategy both`.
- Co wiemy z kontroli statycznej, czyli które audyty by się liczyły: /llms.txt zwraca 404, więc audyt jest "not applicable" i wypada z ułamka. Opublikowanie poprawnego llms.txt dodałoby zaliczany audyt. ai-catalog.json (404) też jest "not applicable". WebMCP: 0 wywołań registerTool, 1 formularz bez adnotacji (toolname/tooldescription), więc audyty WebMCP prawdopodobnie nie zostaną policzone lub nie zaliczą się.

## Agent-UX (heurystyka 0-100, osobna od Lighthouse)

Status: complete (renderowanie powiodło się, drzewo dostępności obecne).

| Strona | Wynik | Przyciski | Linki | Elementy interaktywne bez nazwy | Pola bez etykiety | Landmarki |
|---|---|---|---|---|---|---|
| / | 100 | 11 | 46 | 0 z 54 | 0 | 13 |
| /pricing | 100 | 4 | 30 | 0 z 35 | 0 | 10 |

Brak widgetów div z onclick. Jedyny formularz na stronie głównej (`<form class="flex flex-col ...">`) nie ma problemów z etykietami.

## Polityka dostępu (robots.txt)

robots.txt: jedna grupa `User-agent: *`, `Allow: /`, `Disallow: /api/`, sitemap wskazany (200). Linia `Host:` jest niestandardowa (Yandex), nieszkodliwa.

- Trening (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended): dozwolony przez grupę `*`, brak nazwanych reguł. Content-Signal nie zadeklarowany.
- Wyszukiwanie AI (OAI-SearchBot, Claude-SearchBot, PerplexityBot): dozwolone przez `*`.
- Agenci wywoływani przez użytkownika (ChatGPT-User, Claude-User, Perplexity-User, Google-Agent): dozwolone przez `*`. Zgodnie z dokumentacją vendorów Claude-User respektuje robots.txt, a Perplexity-User i Google-Agent zwykle go ignorują, ChatGPT-User może nie stosować. Robots.txt nie jest więc tu mechanizmem egzekwowania.

## Wyniki kontroli serwera

- Treść bez JS: 1244 słów, brak markerów powłoki JS (pass). Strony są prerenderowane (x-nextjs-prerender).
- 404 dla nieznanych URL: prawdziwe 404 (pass).
- Markdown: brak (Accept: text/markdown zwraca HTML, /index.md i /pricing.md to 404, brak Vary: Accept, brak link rel=alternate).
- /.well-known: api-catalog, oauth-protected-resource, oauth-authorization-server, agent-card.json, ucp, ai-catalog.json: wszystkie 404.
- WebMCP: brak.
- WAF / traktowanie user-agentów agentów: **nie testowano**. Test `--ua-matrix` wymaga wyraźnej zgody użytkownika dla tej witryny, a prośba orkiestratora jej nie zastępuje. Zwykłe żądania curl bez podszywania się pod agentów dostają 200 z Vercel. Aby przetestować, użytkownik musi potwierdzić zgodę.

## Ustalenia wg priorytetu

Brak P0 i P1 będących defektami. Wszystko poniżej to okazje, nie błędy.

### P1 (okazja, niska pilność): brak deklarowanej polityki per cel
- Dowód: jedna grupa `*`, brak Content-Signal, wszyscy boty AI wpadają w `*`.
- Naprawa: zdecyduj świadomie, czy zezwalasz na trening. Jeśli tak, nic nie rób. Jeśli nie, dodaj grupy `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended` z `Disallow: /`, a wyszukiwanie zostaw otwarte. Opcjonalnie linia `Content-Signal: search=yes, ai-input=yes, ai-train=no` (szkic Cloudflare, preferencja, nie egzekwowanie; Google go nie stosuje, sprawdzone 2026-09-23). Dla agentów user-triggered robots.txt nie wystarcza, jeśli kiedyś zechcesz je ograniczać.

### P1 (okazja): brak /llms.txt
- Dowód: 404 (także llms-full.txt).
- Fakty: standard społecznościowy (llmstxt.org), Google Search go ignoruje. Lighthouse sprawdza go i poprawny plik dodałby zaliczany audyt.
- Naprawa (proporcjonalnie, 15 minut): statyczny `public/llms.txt` w Next.js: H1 "Vocare", blok `>` z opisem (analiza profilu, CV, roadmapa, oferty pracy), linki Markdown do /pricing, /blog, stron prawnych. Bez obietnic wpływu na ranking czy cytowania.

### P2 (okazja): brak dostarczania Markdown
- Dowód: Accept: text/markdown zwraca text/html; .md zwraca 404.
- Fakty: żaden potwierdzony agent konsumencki nie wysyła Accept: text/markdown (vendor-matrix). Strony i tak są server-rendered, więc agenci czytają HTML bez problemu.
- Naprawa: pomiń na razie. Ewentualnie później rewrite w next.config dla Accept: text/markdown z Vary: Accept.

### P2 (okazja): WebMCP
- Dowód: 0 registerTool, 1 formularz bez adnotacji.
- Status: szkic W3C Community Group, nie standard; WebKit sprzeciwia się, Mozilla neutralna; origin trial Chrome M149-M156 (sprawdzone 2026-09-23). Wśród agentów tylko ChatGPT desktop wywołuje WebMCP (tryb imperatywny).
- Naprawa: nie wdrażać teraz. Jeśli to zrobicie, rejestrujcie tylko bezpieczne akcje tylko do odczytu, bez zakupu tokenów i bez akcji AI zużywających tokeny.

### P3: pliki /.well-known (ai-catalog.json, api-catalog, agent-card, OAuth, UCP)
- Dowód: 404. Brak publicznego API, MCP ani agenta A2A, więc "not applicable".
- ai-catalog.json (ARD spec 1.0, szkic) i Web Bot Auth (szkic IETF `draft-ietf-webbotauth-httpsig-protocol-00`) nie dotyczą tej witryny. Naprawa: żadna.

### P3: nieprzetestowany WAF
- Brak danych o blokowaniu user-agentów agentów na poziomie Vercel/WAF. Zalecany test po zgodzie użytkownika (`agentic_check.py --ua-matrix`).

## Mocne strony
- Pełna treść w HTML bez JS, prawdziwe 404, czyste drzewo dostępności (0 nienazwanych elementów interaktywnych, 100/100 na dwóch stronach), sitemap.xml działa, /api/ wyłączone z indeksowania.

## Rekomendacje (proporcjonalne dla małego startupu)
1. Skonfigurować klucz PSI i uruchomić ponownie Lighthouse, żeby poznać X/N.
2. Podjąć decyzję o polityce treningu i odzwierciedlić ją w robots.txt.
3. Opcjonalnie dodać statyczny llms.txt.
4. Reszta (Markdown, WebMCP, well-known) to opcje na później, bez obietnic efektu na ruch czy cytowania.

## Dane strukturalne dla audit-data.json (AI Search Readiness)

```json
[
  {"title": "Lighthouse Agentic Browsing niedostępny (PSI 429)", "severity": "Low", "description": "PSI zwróciło HTTP 429 dla mobile i desktop, wynik X/N nie został wyznaczony.", "recommendation": "Skonfigurować klucz Google API i powtórzyć kontrolę."},
  {"title": "Brak jawnej polityki robots.txt dla botów AI i Content-Signal", "severity": "Low", "description": "Jedna grupa User-agent: *; trening, wyszukiwanie AI i agenci użytkownika objęci tą samą regułą.", "recommendation": "Zdecydować o polityce treningu i dodać nazwane grupy lub Content-Signal (szkic) jeśli polityka ma się różnić."},
  {"title": "Brak /llms.txt", "severity": "Low", "description": "/llms.txt zwraca 404; Lighthouse pomija audyt, poprawny plik dodałby zaliczany audyt.", "recommendation": "Opublikować krótki statyczny llms.txt (H1, streszczenie, linki Markdown)."},
  {"title": "Brak dostarczania Markdown i WebMCP", "severity": "Info", "description": "Accept: text/markdown i .md zwracają HTML/404; brak registerTool. Brak potwierdzonych konsumentów Markdown; WebMCP to szkic.", "recommendation": "Opcjonalne, niski priorytet."}
]
```
