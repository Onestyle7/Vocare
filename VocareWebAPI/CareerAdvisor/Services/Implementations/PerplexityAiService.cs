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
        private readonly IUserProfileRepository _userProfileRepository;
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
            IUserProfileRepository userProfileRepository,
            IAiRecommendationRepository recommendationRepository,
            IMapper mapper
        )
        {
            _config = config.Value;
            _httpClient = httpClient;
            _userProfileRepository = userProfileRepository;
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

                // Wyodrębnij JSON z pola content
                var rawContent = apiResponse.Choices[0].Message.Content;

                AiCareerResponseDto result = null;

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
                return null;

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
                - Umiejętności: {{string.Join(", ", profile.Skills)}}
                - Doświadczenie: {{profile.WorkExperience}} lat {{string.Join(
                    ", ",
                    profile.Certificates
                )}}
                - Lokalizacja: {{profile.Country}}, {{profile.Address}}
                - Wykształcenie: {{profile.Education}}
                - Języki: {{string.Join(", ", profile.Languages)}}
                - Dodatkowe informacje: {{profile.AdditionalInformation}}
                - O mnie: {{profile.AboutMe}}
                - Typ osobowości: {{profile.PersonalityType}}

                Wygeneruj wyłącznie dokładnie taki obiekt JSON, bez żadnego dodatkowego tekstu w języku ${{profile.Country}}:
                { 
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
                      }
                    },
                    // Dodaj jeszcze dwie ścieżki kariery w takiej samej strukturze
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
                1. Wygeneruj dokładnie taki format JSON z trzema ścieżkami kariery.
                2. Wypełnij wszystkie pola sensownymi wartościami - nie pozostawiaj żadnych pól pustych.
                3. Każda ścieżka kariery musi zawierać pełną analizę SWOT we wskazanej strukturze.
                4. W polu "recommendation" musi być uzasadnienie i długoterminowy cel.
                5. Zwróć tylko czysty JSON bez dodatkowych objaśnień czy komentarzy.
                6. Upewnij się że działasz wyłącznie na najnowszy danych z 2024 i 2025 roku.
                """;
        }

        /// <summary>
        /// Wyjątek rzucany w przupadku błędów w serwisie AI
        /// </summary>
        public class AiServiceException : Exception
        {
            public AiServiceException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
