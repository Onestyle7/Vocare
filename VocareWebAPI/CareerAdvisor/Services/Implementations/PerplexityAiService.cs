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
    public class PerplexityAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IAiRecommendationRepository _recommendationRepository;
        private readonly IMapper _mapper;

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

        private async Task SaveRecommendationToUserProfile(
            string userId,
            AiCareerResponseDto recommendation
        )
        {
            try
            {
                Console.WriteLine($"Próba zapisu dla użytkownika: {userId}");

                // Stara logika (do usunięcia):
                // var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
                // userProfile.LastRecommendationJson = JsonSerializer.Serialize(recommendation);

                // Nowa logika z AiRecommendation:
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

        public class AiServiceException : Exception
        {
            public AiServiceException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
