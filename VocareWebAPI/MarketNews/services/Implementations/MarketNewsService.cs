using System.Text.Json;
using AutoMapper;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.Repositories.Interfaces;
using VocareWebAPI.MarketNews.Services.Interfaces;

namespace VocareWebAPI.MarketNews.Services.Implementations
{
    public class MarketNewsService : IMarketNewsService
    {
        private readonly IMarketNewsRepository _marketNewsRepository;
        private readonly ILogger<MarketNewsService> _logger;
        private readonly HttpClient _httpClient;
        private readonly IMapper _mapper;
        private readonly PerplexityAIConfig _config;

        public MarketNewsService(
            IMarketNewsRepository marketNewsRepository,
            ILogger<MarketNewsService> logger,
            HttpClient httpClient,
            IMapper mapper,
            IOptions<PerplexityAIConfig> config
        )
        {
            _marketNewsRepository = marketNewsRepository;
            _logger = logger;
            _httpClient = httpClient;
            _mapper = mapper;
            _config = config.Value;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        private async Task<bool> GenerateNewsAsync()
        {
            var actualNewsExists = await _marketNewsRepository.ExistsForDateAsync(DateTime.UtcNow);
            if (actualNewsExists)
            {
                _logger.LogInformation("News for today already exists, skipping generation.");
                return false;
            }
            var previousWeekStart = DateTime.UtcNow.AddDays(
                -7 - (int)DateTime.UtcNow.DayOfWeek + 1
            );
            var previousWeekEnd = previousWeekStart.AddDays(6);
            var previousWeekStartStr = previousWeekStart.ToString("yyyy-MM-dd");
            var previousWeekEndStr = previousWeekEnd.ToString("yyyy-MM-dd");
            var prompt = $$"""
                Jesteś ekspertem analitykiem rynku specjalizującym się w rynku pracy i trendach zatrudnienia. Twoim zadaniem jest stworzenie cotygodniowego podsumowania newslettera w stylu blogowym na stronę główną aplikacji mobilnej i webowej. Skup się na szerokich nowinkach rynkowych, z silnym naciskiem na rynek pracy: kluczowe wydarzenia, trendy, statystyki, ogłoszenia firm, zmiany polityczne, wskaźniki ekonomiczne oraz ciekawe szczegóły lub anegdoty z minionego tygodnia.

                Wyszukaj i podsumuj wydarzenia wyłącznie z poprzedniego tygodnia: od {{previousWeekStartStr}} do {{previousWeekEndStr}} (format: YYYY-MM-DD). Używaj wiarygodnych źródeł, takich jak portale informacyjne, oficjalne raporty i analizy branżowe. Pobieraj dane poprzez wyszukiwanie w sieci, aby zapewnić aktualność i dokładność.

                Kluczowe wymagania:
                - **Szeroki zakres, ale skoncentrowany na rynku pracy**: Omów globalne i regionalne (np. USA, UE, Polska jeśli istotne) nowinki z rynku pracy, w tym trendy zatrudnienia, zwolnienia, zmiany w pracy zdalnej, braki umiejętności, zmiany płac, stopy bezrobocia, wpływ technologii/AI na pracę, finansowanie startupów wpływające na zatrudnienie oraz aktualizacje regulacyjne. Dodaj "fajne fakty" lub zaskakujące szczegóły, aby było angażująco (np. "Czy wiesz, że firma X zatrudniła 500 osób w jeden dzień dzięki viralowemu trendowi?").
                - **Struktura jak wpis blogowy**: 
                  - Tytuł: Atrakcyjny i relewantny, np. "Cotygodniowy Buzz na Rynku Pracy:" Tytuł ma być chwytliwy i trochę clickbaitowy podający istotę treści.
                  - Wstęp: Krótki haczyk (1-2 zdania) podsumowujący klimat tygodnia.
                  - Główne sekcje: 4-6 punktów lub krótkich akapitów, każdy skupiony na głównym wydarzeniu lub trendzie. Włącz:
                    - Co się wydarzyło (fakty).
                    - Dlaczego to ważne (wpływ na szukających pracy/pracodawców).
                    - Ciekawy szczegół (anegdota lub statystyka).
                  - Zakończenie: 1-2 zdania z prognozami lub poradami.
                - **Ton**: Pisz tak, jakbyś prowadził blog ekspercki – profesjonalnie, ale przystępnie, z elementem narracyjnym.
                - **Optymalizacja SEO**: Upewnij się, że treść jest zgodna z najlepszymi praktykami SEO na 2025 rok. Włącz naturalnie słowa kluczowe związane z rynkiem pracy (np. "trendy zatrudnienia 2025", "nowinki na rynku pracy"). Używaj nagłówków H2/H3 dla sekcji (np. ## Sekcja 1), list wypunktowanych dla czytelności, krótkich akapitów. Dodaj sekcję FAQ na końcu, jeśli pasuje. Pisz dla użytkowników, nie dla wyszukiwarek, ale buduj topical authority wokół tematu rynku pracy. Zoptymalizuj tytuł i wstęp pod kątem klikalności.
                - **Format wyjścia**: Zwykły tekst z markdown dla czytelności (pogrubienie nagłówków, punkty dla list, ## dla H2).

                WYMAGANIA DOTYCZĄCE DŁUGOŚCI:
                - Title: krótki i chwytliwy (około 50-100 znaków)
                - Summary: zwięzłe podsumowanie głównych punktów (około 100-150 znaków)
                - Content: ROZBUDOWANY artykuł blogowy z minimum 2500 znaków, idealnie 3000-3500 znaków
                Pamiętaj: Content to PEŁNY ARTYKUŁ, nie streszczenie!

                WAŻNE UWAGI:
                - Nie wymyślaj danych ani statystyk. Jeśli nie masz pewności, podaj orientacyjny trend i zaznacz brak dokładnych liczb.
                - Wplataj słowa kluczowe naturalnie w tekst. Użyj frazy głównej ("rynek pracy 2025") co najmniej raz w tytule, we wstępie i w jednej z sekcji.
                - Dodaj 1 pytanie retoryczne lub ciekawostkę w każdej sekcji, aby zwiększyć zaangażowanie.

                Upewnij się, że treść jest oryginalna, nie skopiowana, i dostosowana do użytkowników aplikacji zainteresowanych rozwojem kariery.
                """;
            var requestBody = new
            {
                model = _config.Model,
                messages = new[] { new { role = "user", content = prompt } },
                response_format = new
                {
                    type = "json_schema",
                    json_schema = new
                    {
                        name = "market_news", // ⚠️ DODAJ name - wymagane!
                        strict = true, // ⚠️ DODAJ strict - wymagane!
                        schema = new
                        {
                            type = "object",
                            properties = new
                            {
                                title = new
                                {
                                    type = "string",
                                    description = "Tytuł newsa w formacie markdown",
                                },
                                content = new
                                {
                                    type = "string",
                                    description = "Treść newsa w formacie markdown",
                                },
                                summary = new
                                {
                                    type = "string",
                                    description = "Podsumowanie newsa w formacie markdown",
                                },
                            },
                            required = new[] { "title", "content", "summary" },
                            additionalProperties = false,
                        },
                    },
                },
            };

            var response = await _httpClient.PostAsJsonAsync(
                new Uri(_config.BaseUrl + "/chat/completions"),
                requestBody
            );

            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation(
                "Response status: {StatusCode}, Content length: {Length}",
                response.StatusCode,
                responseContent.Length
            );
            var preview =
                responseContent.Length > 500
                    ? responseContent.Substring(0, 500) + "..."
                    : responseContent;
            _logger.LogInformation("Response preview: {Preview}", preview);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Error generating market news: {StatusCode} - {ResponseContent}",
                    response.StatusCode,
                    responseContent
                );
                throw new Exception(
                    $"Error generating market news: {response.StatusCode} - {responseContent}"
                );
            }
            try
            { // 🔍 Sprawdź czy odpowiedź to JSON
                if (responseContent.TrimStart().StartsWith("<"))
                {
                    _logger.LogError("Response is HTML/XML, not JSON: {Content}", responseContent);
                    throw new Exception("API returned HTML/XML instead of JSON");
                }
                // 🔍 KROK 1: Parsowanie structured JSON response
                using var json = JsonDocument.Parse(responseContent);
                var aiContent = json
                    .RootElement.GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                // Dodaj pełne logowanie aiContent
                _logger.LogInformation("AI Content full: {Content}", aiContent);

                using var contentJson = JsonDocument.Parse(aiContent);
                var title =
                    contentJson.RootElement.GetProperty("title").GetString()
                    ?? "Cotygodniowe podsumowanie";
                var summary = contentJson.RootElement.GetProperty("summary").GetString() ?? "";
                var content = contentJson.RootElement.GetProperty("content").GetString() ?? "";

                // 🛡️ KROK 3: Validation (database constraints)
                if (title.Length > 100)
                {
                    _logger.LogWarning("Title exceeds limit: {Length} chars", title.Length);
                    title = title.Substring(0, 97) + "...";
                }

                if (summary.Length > 150)
                {
                    _logger.LogWarning("Summary exceeds limit: {Length} chars", summary.Length);
                    summary = summary.Substring(0, 147) + "...";
                }

                if (content.Length > 10000)
                {
                    _logger.LogWarning(
                        "Content exceeds database limit: {Length} chars",
                        content.Length
                    );
                    content = content.Substring(0, 9997) + "...";
                }

                _logger.LogInformation(
                    "Generated content lengths - Title: {TitleLen}, Summary: {SummaryLen}, Content: {ContentLen}",
                    title.Length,
                    summary.Length,
                    content.Length
                );

                // 🏗️ KROK 4: Tworzenie obiektu MarketNews
                var marketNews = new MarketNewsEntity
                {
                    Id = Guid.NewGuid(),
                    Title = title,
                    Summary = summary,
                    Content = content,
                    CreatedAt = DateTime.UtcNow,
                };

                // 💾 KROK 5: Zapis do bazy
                await _marketNewsRepository.AddAsync(marketNews);

                _logger.LogInformation(
                    "Successfully generated and saved market news with ID: {NewsId}",
                    marketNews.Id
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse AI response or save to database");
                throw;
            }
        }

        public async Task<bool> GenerateNewsManuallyAsync()
        {
            return await GenerateNewsAsync();
        }

        public async Task<bool> GenerateWeeklyNewsAsync()
        {
            return await GenerateNewsAsync();
        }

        public async Task<MarketNewsPagedDto> GetAllForBlogAsync(int page, int pageSize)
        {
            var (news, totalCount) = await _marketNewsRepository.GetAllPagedAsync(page, pageSize);
            var newsDto = _mapper.Map<List<MarketNewsListDto>>(news);

            return new MarketNewsPagedDto
            {
                News = newsDto,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MarketNewsDetailDto?> GetDetailAsync(Guid id)
        {
            var entity = await _marketNewsRepository.GetByIdAsync(id);
            if (entity == null)
                return null;

            return _mapper.Map<MarketNewsDetailDto?>(entity);
        }

        public async Task<List<MarketNewsListDto>> GetLatest3ForHomepageAsync()
        {
            var latest3news = await _marketNewsRepository.GetLatest3Async();
            return _mapper.Map<List<MarketNewsListDto>>(latest3news);
        }

        public async Task<MarketNewsListDto?> GetLatestForPopupAsync()
        {
            var entity = await _marketNewsRepository.GetLatestAsync();
            if (entity == null)
                return null;

            return _mapper.Map<MarketNewsListDto>(entity);
        }
    }
}
