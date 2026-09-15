using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.MarketNews.services.interfaces;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.MarketNews.services.Implementations
{
    public class MarketPulseGeneratorService : IMarketPulseGeneratorService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly IMarketPulseService _marketPulseService;
        private readonly ILogger<MarketPulseGeneratorService> _logger;

        public MarketPulseGeneratorService(
            IMarketPulseService marketPulseService,
            ILogger<MarketPulseGeneratorService> logger,
            HttpClient httpClient,
            IOptions<OpenAIConfig> config
        )
        {
            _logger = logger;
            _marketPulseService = marketPulseService;
            _httpClient = httpClient;
            _config = config.Value;
        }

        public async Task<bool> GenerateAsync()
        {
            var periodStart = DateTime.UtcNow.AddDays(-7 - (int)DateTime.UtcNow.DayOfWeek + 1).Date;
            var periodEnd = periodStart.AddDays(6);

            if (await _marketPulseService.ExistsForPeriodAsync(periodStart, periodEnd))
            {
                _logger.LogInformation(
                    "Market Pulse post for period {Start} - {End} already exists, skippiung generation.",
                    periodStart,
                    periodEnd
                );
                return false;
            }

            var periodStartString = periodStart.ToString("yyyy-MM-dd");
            var periodEndString = periodEnd.ToString("yyyy-MM-dd");

            var prompt = $$"""
                    Jesteś doświadczonym dziennikarzem branżowym i analitykiem rynku pracy. Piszesz cotygodniowy artykuł "Market Pulse" na blog Vocare.pl — serwisu dla osób szukających pracy, zmieniających branżę i planujących karierę. Artykuł ma rankować wysoko w Google na zapytania o aktualną sytuację na rynku pracy w Polsce i być cytowany przez wyszukiwarki AI (Google AI Overviews, ChatGPT, Perplexity).

                    ZAKRES I ŹRÓDŁA:
                    - Wyszukaj i opisz wydarzenia WYŁĄCZNIE z okresu od {{periodStartString}} do {{periodEndString}} (format: YYYY-MM-DD). Nie uwzględniaj wydarzeń spoza tego zakresu, nawet jeśli są istotne.
                    - Wyszukaj maksymalnie 10 różnych źródeł. Nie powtarzaj informacji z tego samego źródła.
                    - Nie wymyślaj danych ani statystyk. Jeśli nie masz pewności co do liczby, opisz trend słownie ("wyraźny wzrost", "spadek rzędu kilku procent") zamiast podawać konkretną wartość bez źródła.
                    - Każdy konkretny fakt lub liczbę przypisz do źródła PO NAZWIE w zwykłym tekście, np. "według danych GUS", "jak podaje Pracuj.pl w raporcie...". NIGDY nie wstawiaj hiperlinków ani adresów URL w treści — artykuł jest publikowany automatycznie bez weryfikacji i każdy błędny link trafiłby na stronę.

                    TEMATYKA: rynek pracy w Polsce (z kontekstem europejskim/globalnym tylko gdy wpływa na Polskę): trendy zatrudnienia, zwolnienia grupowe i rekrutacje, praca zdalna i hybrydowa, braki kompetencji, wynagrodzenia, bezrobocie, wpływ AI na zawody, regulacje i prawo pracy, branże z największym popytem.

                    FRAZA KLUCZOWA: wybierz jedną główną frazę pasującą do treści tygodnia (np. "rynek pracy w Polsce", "trendy na rynku pracy", "zmiany na rynku pracy") i użyj jej naturalnie:
                    - w tytule,
                    - w pierwszym akapicie,
                    - w co najmniej jednym nagłówku H2.
                    Nie upychaj frazy sztucznie — ma brzmieć jak normalne zdanie. Frazy pokrewne (np. "zatrudnienie", "wynagrodzenia", "rekrutacja", "bezrobocie") wplataj w treść sekcji, gdzie pasują merytorycznie.

                    TITLE (osobne pole, 50-70 znaków):
                    - Zawiera główną frazę kluczową oraz miesiąc i rok okresu (np. "wrzesień 2026") — to wzmacnia sygnał świeżości i łapie zapytania z datą.
                    - Konkretny, obiecujący realną treść, bez clickbaitu. Dobrze: "Rynek pracy w Polsce, wrzesień 2026: fala zwolnień w IT i rekordowy popyt na inżynierów". Źle: "Nie uwierzysz, co stało się na rynku pracy!".
                    - Wyłącznie polskie litery, cyfry, spacje, przecinki, dwukropki i myślniki. Bez cudzysłowów, nawiasów, znaków specjalnych i emoji.

                    SUMMARY (osobne pole, 120-155 znaków) — to jest meta description artykułu, widoczne w wynikach Google i przy udostępnianiu w social media:
                    - Zaczyna się od konkretu tygodnia (najważniejsze wydarzenie lub liczba), zawiera główną frazę kluczową i daje powód do kliknięcia (co czytelnik zyska).
                    - Pełne zdania, bez urwania w połowie, bez powtarzania tytułu słowo w słowo.

                    CONTENT (osobne pole, markdown) — trzymaj się DOKŁADNIE tej struktury, to standard bloga Vocare:
                    1. NIE zaczynaj od nagłówka H1 — tytuł jest osobnym polem i renderuje się nad treścią.
                    2. Pierwszy akapit (3-4 zdania): od razu odpowiedz, co najważniejszego zmieniło się na rynku pracy w tym tygodniu i dla kogo ma to znaczenie. Bez wstępu typu "W dzisiejszym dynamicznym świecie...". Zawiera główną frazę kluczową i jedno pogrubione kluczowe sformułowanie.
                    3. Zaraz po wstępie blockquote dokładnie w tym formacie:
                       > **Najważniejsze wnioski**
                       > - najważniejszy, konkretny fakt tygodnia (z liczbą lub nazwą, jeśli masz pewne źródło)
                       > - drugi fakt
                       > - trzeci fakt lub praktyczna implikacja dla szukających pracy
                    4. Potem linia `---` i 5-7 sekcji z nagłówkami `##` (H2). Nagłówki mają być konkretne i opisowe (np. "## Zwolnienia w sektorze IT: kogo dotknęły i dlaczego"), nie ogólne ("## Zwolnienia"). Każda sekcja to 3-5 akapitów, które odpowiadają kolejno na:
                       - co się wydarzyło (fakty, ze źródłem po nazwie),
                       - dlaczego to ważne — dla kogo konkretnie (junior/senior, branża, region, pracodawcy),
                       - co z tego wynika dla osoby szukającej pracy lub planującej zmianę — to jest Twoja własna analiza i wartość dodana artykułu, której nie ma w źródłach. Nie streszczaj tylko newsów: interpretuj je.
                       Tam, gdzie sekcja obejmuje kilka wątków, użyj podnagłówków `###` (H3). Listy wypunktowane stosuj do wyliczeń (branże, stanowiska, liczby), nie do całych akapitów.
                    5. Pogrubiaj kluczowe fakty, liczby, nazwy firm i instytucji (pojedyncze sformułowania, nie całe zdania).
                    6. Przedostatnia sekcja: `## Co to oznacza dla Ciebie` — 3-5 konkretnych, praktycznych wskazówek dla osób szukających pracy lub zmieniających ją, wynikających bezpośrednio z opisanych wydarzeń (np. jakie kompetencje warto teraz pokazać w CV, które branże obserwować, jak reagować na zmiany wynagrodzeń).
                    7. Ostatnia sekcja: `## Najczęstsze pytania` — 3 pytania, jakie czytelnik mógłby wpisać w Google w związku z tematami tygodnia, każde jako nagłówek `###` z odpowiedzią w 2-3 zdaniach, zaczynającą się od bezpośredniej odpowiedzi.
                    8. Ton: konkretny, rzeczowy, jak dobry dziennikarz ekonomiczny piszący dla ludzi, nie dla firm. Zero sztucznego entuzjazmu, zero ogólników, zero frazesów w stylu "w obecnych czasach", "warto pamiętać, że", "jak wszyscy wiemy". Krótkie zdania na przemian z dłuższymi. Zwracaj się do czytelnika bezpośrednio ("Ty"), tam gdzie to naturalne.

                    WYMAGANIA DŁUGOŚCI:
                    - Title: 50-70 znaków
                    - Summary: 120-155 znaków
                    - Content: 7000-9000 znaków (około 1000-1300 słów). To pełny, rozbudowany artykuł, nie streszczenie. Minimum bezwzględne: 6000 znaków.

                    Cała treść wyłącznie w języku polskim.
                """;

            var request = new
            {
                model = _config.Model,
                tools = new[]
                {
                    new
                    {
                        type = "web_search",
                        filters = new
                        {
                            allowed_domains = new[]
                            {
                                "pulshr.pl",
                                "rynekpracy.pl",
                                "gowork.pl",
                                "bankier.pl",
                                "businessinsider.com.pl",
                            },
                        },
                    },
                },
                input = prompt,
                text = new
                {
                    format = new
                    {
                        type = "json_schema",
                        name = "market_pulse_post",
                        strict = true,
                        schema = new
                        {
                            type = "object",
                            properties = new
                            {
                                title = new { type = "string", description = "Tytuł wpisu" },
                                summary = new
                                {
                                    type = "string",
                                    description = "Krótkie podsumowanie",
                                },
                                content = new
                                {
                                    type = "string",
                                    description = "Pełna treść w markdown",
                                },
                            },
                            required = new[] { "title", "summary", "content" },
                            additionalProperties = false,
                        },
                    },
                },
            };

            var response = await _httpClient.PostAsJsonAsync("responses", request);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation(
                "Response status: {StatusCode}, Content length: {Length}",
                response.StatusCode,
                responseContent.Length
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Error generating market pulse post: {StatusCode} - {ResponseContent}",
                    response.StatusCode,
                    responseContent
                );
                throw new AiServiceException(
                    $"Error generating market pulse post: {response.StatusCode} - {responseContent}"
                );
            }
            using var json = JsonDocument.Parse(responseContent);

            JsonElement? messageItem = null;
            foreach (var item in json.RootElement.GetProperty("output").EnumerateArray())
            {
                if (item.GetProperty("type").GetString() == "message")
                {
                    messageItem = item;
                    break;
                }
            }

            if (messageItem == null)
            {
                _logger.LogError(
                    "No message item found in response output: {Content}",
                    responseContent
                );
                throw new AiServiceException("Invalid API response: missing message item.");
            }

            var outputText = messageItem
                .Value.GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(outputText))
            {
                throw new AiServiceException("Invalid API response: empty output text.");
            }

            using var contentJson = JsonDocument.Parse(outputText);
            var title = contentJson.RootElement.GetProperty("title").GetString();
            var summary = contentJson.RootElement.GetProperty("summary").GetString();
            var content = contentJson.RootElement.GetProperty("content").GetString();

            if (
                string.IsNullOrEmpty(title)
                || string.IsNullOrEmpty(summary)
                || string.IsNullOrEmpty(content)
            )
            {
                throw new AiServiceException(
                    "Invalid API response: missing required fields in parsed content."
                );
            }

            await _marketPulseService.CreateAsync(
                title,
                summary,
                content,
                "market-pulse",
                periodStart,
                periodEnd
            );

            _logger.LogInformation(
                "Successfully generated Market Pulse post for period {Start} - {End}",
                periodStart,
                periodEnd
            );

            return true;
        }
    }
}
