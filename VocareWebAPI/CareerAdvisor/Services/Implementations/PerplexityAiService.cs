using System.Text.Json;
using AutoMapper;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.Services
{
    /// <summary>
    /// Serwis odpowiedzialny za generowanie rekomendacji zawodowych przy użyciu API Perplexity
    /// </summary>
    public class PerplexityAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;
        private readonly IAiRecommendationRepository _recommendationRepository;
        private readonly IMapper _mapper;

        /// <summary>
        /// Inicjalizuje nową instację serwisu PerplexityAiService
        /// </summary>
        /// <param name="config">Konfiguracja AI</param>
        /// <param name="httpClient">Klient HTTP do komunikacji z API AI</param>
        /// <param name="userProfileRepository">Repozytorium profili użytkowników</param>
        /// <param name="recommendationRepository">Repozytorium rekomendacji AI</param>
        /// <param name="mapper">Mapper do mapowania obiektów</param>
        public PerplexityAiService(
            IOptions<AiConfig> config,
            HttpClient httpClient,
            IAiRecommendationRepository recommendationRepository,
            IMapper mapper
        )
        {
            _config = config.Value;
            _httpClient = httpClient;
            _recommendationRepository = recommendationRepository;
            _mapper = mapper;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        /// <summary>
        /// Generuje rekomendacje zawodowe na podstawie profilu użytkownika
        /// </summary>
        /// <param name="profile">Profil użytkownika</param>
        /// <returns>Rekomendacje zawodowe w formacie DTO</returns>
        /// <exception cref="AiServiceException">Rzucane, gdy wystąpi bład w komunikacji z API AI lub podczas przetwarzania odpowiedzi</exception>
        public async Task<AiCareerResponseDto> GetCareerRecommendationsAsync(UserProfile profile)
        {
            var prompt = BuildPrompt(profile);

            var requestBody = new
            {
                model = _config.Model,
                messages = new[] { new { role = "user", content = prompt } },
            };
            try
            {
                var absoluteUri = new Uri(_config.BaseUrl + "/chat/completions");
                var response = await _httpClient.PostAsJsonAsync(absoluteUri, requestBody);

                var responseContent = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<PerplexityApiResponseDto>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                    throw new AiServiceException("Invalid API response: missing choices.");
                var message = apiResponse.Choices[0].Message;

                // Wyodrębnij JSON z pola content
                var rawContent = message?.Content;
                if (string.IsNullOrWhiteSpace(rawContent))
                    throw new AiServiceException("Invalid API response: missing content block.");

                AiCareerResponseDto? result = null;

                // Najpierw spróbuj znaleźć blok json
                if (rawContent.Contains("```json") && rawContent.Contains("```"))
                {
                    var jsonStart = rawContent.IndexOf("```json") + "```json".Length;
                    var jsonEnd = rawContent.LastIndexOf("```");
                    if (jsonStart >= "```json".Length && jsonEnd > jsonStart)
                    {
                        var cleanJson = rawContent.Substring(jsonStart, jsonEnd - jsonStart).Trim();
                        try
                        {
                            result = JsonSerializer.Deserialize<AiCareerResponseDto>(
                                cleanJson,
                                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                            );
                        }
                        catch (JsonException) { }
                    }
                }

                // Jeśli nie udało się, spróbuj ekstrakcji całej treści jako JSON
                if (result == null)
                {
                    try
                    {
                        result = JsonSerializer.Deserialize<AiCareerResponseDto>(
                            rawContent,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                    }
                    catch (JsonException ex)
                    {
                        throw new AiServiceException(
                            "Nie udało się przetworzyć odpowiedzi AI jako JSON",
                            ex
                        );
                    }
                }
                if (result == null)
                    throw new AiServiceException(
                        "Nie udało się przetworzyć odpowiedzi AI jako JSON"
                    );
                // Upewnij się, że podstawowe struktury nie są null
                InitializeNullProperties(result);

                await SaveRecommendationToUserProfile(profile.UserId, result);
                return result;
            }
            catch (HttpRequestException e)
            {
                throw new AiServiceException("Błąd komunikacji z API", e);
            }
        }

        /// <summary>
        /// Zapisuje rekomendację zawodową do profilu użytkownika w baziee danych
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <param name="recommendation">Rekomendacja zawodowa w formaci DTO</param>
        /// <returns>Task reprezentujacy operację asynchroniczną</returns>
        /// <exception cref="AiServiceException">Rzucane, gdy wystąpi błąd podczas zapisu</exception>
        private async Task SaveRecommendationToUserProfile(
            string userId,
            AiCareerResponseDto recommendation
        )
        {
            try
            {
                Console.WriteLine($"Próba zapisu dla użytkownika: {userId}");

                var recommendationEntity = _mapper.Map<AiRecommendation>(recommendation);
                recommendationEntity.UserId = userId;
                recommendationEntity.RecommendationDate = DateTime.UtcNow;

                await _recommendationRepository.AddRecommendationAsync(recommendationEntity);
                Console.WriteLine("Zapisano pomyślnie!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"BŁĄD ZAPISU: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Pobiera ostatnią rekomendację zawodową dla użytkowika
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <returns>Ostatnia rekomendacja zawodowa w formacie DTO lub null, jesli nie znaleziono</returns>

        public async Task<AiCareerResponseDto> GetLastRecommendationAsync(string userId)
        {
            var recommendation = await _recommendationRepository.GetLatestByUserIdAsync(userId);

            if (recommendation == null)
                throw new AiServiceException("Nie znaleziono rekomendacji dla tego użytkownika.");

            var dto = _mapper.Map<AiCareerResponseDto>(recommendation);
            dto.Recommendation = new FinalRecommendationDto
            {
                PrimaryPath = recommendation.PrimaryPath,
                Justification = recommendation.Justification,
                LongTermGoal = recommendation.LongTermGoal,
                NextSteps = recommendation.NextSteps.Select(ns => ns.Step).ToList(),
            };
            return dto;
        }

        /// <summary>
        /// Inicjalizuje właściwości, które mogą być null, aby uniknąć NullReferenceException
        /// </summary>
        /// <param name="response"></param>
        // Inicjalizacja null-owych właściwości, aby uniknąć NullReferenceException
        private void InitializeNullProperties(AiCareerResponseDto response)
        {
            if (response.CareerPaths == null)
                response.CareerPaths = new List<CareerPathDto>();

            if (response.Recommendation == null)
                response.Recommendation = new FinalRecommendationDto();

            foreach (var path in response.CareerPaths)
            {
                path.RequiredSkills ??= new List<string>();
                path.MarketAnalysis ??= new List<string>();
                path.RecommendedCourses ??= new List<string>();

                if (path.SwotAnalysis == null)
                {
                    path.SwotAnalysis = new SwotAnalysisDto
                    {
                        Strengths = new List<string>(),
                        Weaknesses = new List<string>(),
                        Opportunities = new List<string>(),
                        Threats = new List<string>(),
                    };
                }
                else
                {
                    path.SwotAnalysis.Strengths ??= new List<string>();
                    path.SwotAnalysis.Weaknesses ??= new List<string>();
                    path.SwotAnalysis.Opportunities ??= new List<string>();
                    path.SwotAnalysis.Threats ??= new List<string>();
                }
            }

            response.Recommendation.NextSteps ??= new List<string>();
        }

        /// <summary>
        /// Buduje prompt do wysłania do API Perplexity na podstawie profilu użytkownika
        /// </summary>
        /// <param name="profile">Profil użytkownika</param>
        /// <returns>Prompt w formacie string</returns>
        private string BuildPrompt(UserProfile profile)
        {
            return $$"""
                Jesteś doradcą zawodowym. Na podstawie poniższych danych użytkownika:
                - Imię: {{profile.FirstName}} {{profile.LastName}}
                - Umiejętności: {{string.Join(", ", profile.Skills)}},
                - Umiejętności miękkie: {{string.Join(", ", profile.SoftSkills)}},
                - Doświadczenie zawodowe:
                {{(
                    profile.WorkExperience != null
                        ? string.Join(
                            "\n",
                            profile.WorkExperience.Select(w =>
                                $"- {w.Position} w {w.Company} (od {w.StartDate:yyyy-MM-dd} do {(w.EndDate.HasValue ? w.EndDate.Value.ToString("yyyy-MM-dd") : "obecnie")}): {w.Description}"
                            )
                        )
                        : "Brak doświadczenia zawodowego"
                )}}
                - Wymagania finansowe:
                {{(
                    profile.FinancialSurvey != null
                        ? $"Aktualne zarobki {profile.FinancialSurvey.CurrentSalary} PLN, W ciągu najbliższych miesięcy chciałbym rozpocząć drogę do {profile.FinancialSurvey.DesiredSalary} PLN miesięcznie, Status zadłużeń to {profile.FinancialSurvey.HasLoans }, szczegóły zadłużeń: {profile.FinancialSurvey.LoanDetails ?? "Brak"}, Poziom ryzyka jakie jest gotów podjąć: {profile.FinancialSurvey.RiskAppetite}, czy relokacja wchodzi w grę Relokacja: {profile.FinancialSurvey.WillingToRelocate}"
                        : "Brak danych finansowych"
                )}}
                - Wykształcenie:
                {{(
                    profile.Education != null && profile.Education.Any()
                        ? string.Join(
                            "\n",
                            profile.Education.Select(e =>
                                $"- {e.Degree} w {e.Field}, {e.Institution} (od {e.StartDate?.ToString("yyyy-MM-dd") ?? "Brak"} do {(e.EndDate?.ToString("yyyy-MM-dd") ?? "obecnie")})"
                            )
                        )
                        : "Brak wykształcenia"
                )}}
                - Certyfikaty:
                {{(
                    profile.Certificates != null
                        ? string.Join(
                            "\n",
                            profile.Certificates.Select(c =>
                                $"- {c.Name} (wydany przez {c.Issuer ?? "Brak wydawcy"}, {c.Date?.ToString("yyyy-MM-dd") ?? "Brak daty"})"
                            )
                        )
                        : "Brak certyfikatów"
                )}}
                - Lokalizacja: {{profile.Country}}, {{profile.Address}}
                - Języki: {{string.Join(", ", profile.Languages )}}
                - Dodatkowe informacje: {{profile.AdditionalInformation ?? "Brak dodatkowych informacji"}}
                - O mnie: {{profile.AboutMe ?? "Brak opisu 'o mnie'"}}
                - Typ osobowości: {{profile.PersonalityType.ToString()}}
                - Czy gotów do przebranżowienia: {{profile.WillingToRebrand}}

                Wygeneruj dokładnie taki obiekt JSON, bez żadnego dodatkowego tekstu w języku Polskim, jeżeli powyższe inforamcje są w języku Polskim, jeśli nie to wygeneruj w języku Angielskim:                 { 
                "careerPaths": [
                    {
                    "careerName": "Nazwa ścieżki 1",
                    "description": "Krótki opis ścieżki",
                    "probability": 85,
                    "requiredSkills": ["Umiejętność 1", "Umiejętność 2"],
                    "marketAnalysis": [
                        "Wniosek z analizy rynku 1",
                        "Wniosek z analizy rynku 2",
                        "Wniosek z analizy rynku 3"
                    ],
                    "recommendedCourses": [
                        "Kurs 1",
                        "Kurs 2",
                        "Kurs 3"
                    ],
                    "swot": {
                        "strengths": ["Mocna strona 1", "Mocna strona 2"],
                        "weaknesses": ["Słaba strona 1", "Słaba strona 2"],
                        "opportunities": ["Szansa 1", "Szansa 2"],
                        "threats": ["Zagrożenie 1", "Zagrożenie 2"]
                    },
                    "careerStatistics": {
                        "averageSalary": "Średnie wynagrodzenie",
                        "jobOpenings": "Liczba ofert pracy",
                        "growthRate": "Tempo wzrostu"
                    }
                    },
                    {
                    "careerName": "Nazwa ścieżki 2",
                    "description": "Krótki opis ścieżki",
                    "probability": 70,
                    "requiredSkills": ["Umiejętność 3", "Umiejętność 4"],
                    "marketAnalysis": [
                        "Wniosek z analizy rynku 1",
                        "Wniosek z analizy rynku 2",
                        "Wniosek z analizy rynku 3"
                    ],
                    "recommendedCourses": [
                        "Kurs 1",
                        "Kurs 2",
                        "Kurs 3"
                    ],
                    "swot": {
                        "strengths": ["Mocna strona 1", "Mocna strona 2"],
                        "weaknesses": ["Słaba strona 1", "Słaba strona 2"],
                        "opportunities": ["Szansa 1", "Szansa 2"],
                        "threats": ["Zagrożenie 1", "Zagrożenie 2"]
                    },
                    "careerStatistics": {
                        "averageSalary": "Średnie wynagrodzenie",
                        "jobOpenings": "Liczba ofert pracy",
                        "growthRate": "Tempo wzrostu"
                    }
                    },
                    {
                    "careerName": "Nazwa ścieżki 3",
                    "description": "Krótki opis ścieżki",
                    "probability": 60,
                    "requiredSkills": ["Umiejętność 5", "Umiejętność 6"],
                    "marketAnalysis": [
                        "Wniosek z analizy rynku 1",
                        "Wniosek z analizy rynku 2",
                        "Wniosek z analizy rynku 3"
                    ],
                    "recommendedCourses": [
                        "Kurs 1",
                        "Kurs 2",
                        "Kurs 3"
                    ],
                    "swot": {
                        "strengths": ["Mocna strona 1", "Mocna strona 2"],
                        "weaknesses": ["Słaba strona 1", "Słaba strona 2"],
                        "opportunities": ["Szansa 1", "Szansa 2"],
                        "threats": ["Zagrożenie 1", "Zagrożenie 2"]
                    },
                    "careerStatistics": {
                        "averageSalary": "Średnie wynagrodzenie",
                        "jobOpenings": "Liczba ofert pracy",
                        "growthRate": "Tempo wzrostu"
                    }
                    }
                ],
                "recommendation": {
                    "primaryPath": "Nazwa rekomendowanej ścieżki",
                    "justification": "Uzasadnienie wyboru tej ścieżki",
                    "nextSteps": [
                    "Krok 1",
                    "Krok 2",
                    "Krok 3",
                    "Krok 4"
                    ],
                    "longTermGoal": "Długoterminowy cel"
                }
                }

                Ważne:
                1. Generuj trzy ścieżki kariery na podstawie umiejętności, doświadczenia, wykształcenia i lokalizacji użytkownika.
                2. Wypełniaj wszystkie pola sensownymi wartościami, dostosowanymi do profilu użytkownika i ogólnych trendów rynkowych.
                3. Prawdopodobieństwo sukcesu (probability) oblicz na podstawie dopasowania profilu użytkownika do ścieżki.
                4. Analiza rynku (marketAnalysis) powinna odzwierciedlać trendy w {{profile.Country}}.
                5. Rekomendowane kursy (recommendedCourses) powinny być konkretne i dostępne w regionie użytkownika lub online.
                6. Analiza SWOT musi być kompletna i powiązana z profilem użytkownika oraz rynkiem pracy.
                7. W sekcji 'recommendation' wybierz jedną ścieżkę, uzasadnij wybór i podaj konkretne kroki.
                8. Wypełnij 'careerStatistics' danymi statystycznymi, takimi jak średnie wynagrodzenie, liczba ofert pracy i tempo wzrostu.
                9. Bazuj na ogólnej wiedzy o rynku pracy, bez odwoływania się do konkretnych danych z 2024 czy 2025 roku.
                """;
        }

        public List<string> GetAvailableProviders()
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Wyjątek rzucany w przupadku błędów w serwisie AI
        /// </summary>
        public class AiServiceException : Exception
        {
            public AiServiceException(string message)
                : base(message) { }

            public AiServiceException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
