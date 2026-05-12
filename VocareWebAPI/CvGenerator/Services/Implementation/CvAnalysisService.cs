using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CvGenerator.Exceptions;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Models.Entities;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Shared.Exceptions;
using static VocareWebAPI.Services.PerplexityAiService;

namespace VocareWebAPI.CvGenerator.Services.Implementation
{
    public class CvAnalysisService : ICvAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly ICvAnalysisRepository _cvAnalysisRepository;
        private readonly IGeneratedCvRepository _generatedCvRepository;
        private readonly ILogger<CvAnalysisService> _logger;

        public CvAnalysisService(
            HttpClient httpClient,
            IOptions<OpenAIConfig> aiConfig,
            ICvAnalysisRepository cvAnalysisRepository,
            ILogger<CvAnalysisService> logger,
            IGeneratedCvRepository generatedCvRepository
        )
        {
            _httpClient = httpClient;
            _config = aiConfig.Value;
            _cvAnalysisRepository = cvAnalysisRepository;
            _logger = logger;
            _generatedCvRepository = generatedCvRepository;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<CvAnalysisResultDto> AnalyzeCvAsync(Guid cvId, string userId)
        {
            var cv = await _generatedCvRepository.GetByIdAsync(cvId);
            if (cv == null || string.IsNullOrEmpty(cv.CvJson))
            {
                throw new CvNotFoundException(cvId);
            }
            var cvBelongsTouser = await _generatedCvRepository.BelongsToUserAsync(cvId, userId);
            if (!cvBelongsTouser)
            {
                throw new CvAccessDeniedException(cvId);
            }
            var prompt = BuildPrompt(cv.CvJson, cv.TargetPosition);
            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Jesteś ekspertem doradztwa zawodowego z wieloletnim doświadczeniem. "
                            + "Twoje analizy są oparte na aktualnych trendach rynkowych i realnych danych. "
                            + "Zawsze odpowiadasz w formacie JSON.",
                    },
                    new { role = "user", content = prompt },
                },
                response_format = new { type = "json_object" },
            };
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "https://api.openai.com/v1/chat/completions",
                    requestBody
                );

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        $"OpenAI API error: {response.StatusCode} - {responseContent}"
                    );
                    throw new AiServiceException(
                        $"OpenAi API error: {response.StatusCode} - {responseContent}"
                    );
                }
                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                    throw new AiServiceException("Invalid API reponse: missing choices");

                var content = apiResponse.Choices[0].Message?.Content;

                if (string.IsNullOrWhiteSpace(content))
                    throw new AiServiceException("Invalid API reponse: empty content");

                var result = JsonSerializer.Deserialize<CvAnalysisResultDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (result == null)
                {
                    throw new AiServiceException(
                        "Failed to parse career recommendations from JSON"
                    );
                }

                var analysis = new CvAnalysis
                {
                    Id = Guid.NewGuid(),
                    CvId = cvId,
                    ResultJson = content,
                    CvVersionAtAnalysis = cv.Version,
                };
                await _cvAnalysisRepository.SaveAsync(analysis);
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error comunicating with OpenAI API");
                throw new AiServiceException("Błąd komunikacji z API", ex);
            }
        }

        public async Task<CvAnalysisResultDto> GetAnalysisAsync(Guid cvId, string userId)
        {
            var cv = await _generatedCvRepository.GetByIdAsync(cvId);
            if (cv == null)
                throw new CvNotFoundException(cvId);

            var cvBelongsToUser = await _generatedCvRepository.BelongsToUserAsync(cvId, userId);
            if (!cvBelongsToUser)
                throw new CvAccessDeniedException(cvId);

            var analysis = await _cvAnalysisRepository.GetByCvIdAsync(cvId);
            if (analysis == null)
                throw new CvAnalysisNotFoundException(cvId);

            return JsonSerializer.Deserialize<CvAnalysisResultDto>(
                    analysis.ResultJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? throw new AiServiceException("Failed to deserialize reulst");
        }

        private string BuildPrompt(string cvJson, string? targetPosition)
        {
            var positionContext = !string.IsNullOrEmpty(targetPosition)
                ? $"STANOWISKO DOCELOWE: {targetPosition}\nOceń dopasowanie CV do tego stanowiska w targetPositionScore."
                : "Brak stanowiska docelowego — ustaw targetPositionScore na 0.";

            return $$"""
                Przeanalizuj poniższe CV i oceń jego jakość. Odpowiedz WYŁĄCZNIE poprawnym JSONem.



                ZASADY OCENY:
                1. OverallScore (0-100) — ogólna jakość CV.
                2. TargetPositionScore (0-100) — dopasowanie do stanowiska docelowego (jeśli podane w CV). Jeśli brak stanowiska, ustaw 0.
                3. Oceń każdą sekcję osobno w SectionScores. Sekcje: Basics, Work, Education, Certificates, Skills, Languages, Projects, Social.                4. Dla każdej sekcji podaj konkretne, actionable insighty — co poprawić, czego brakuje.
                5. TopImprovements — 3 najważniejsze zmiany, które najbardziej podniosą jakość CV.

                KRYTERIA OCENY SEKCJI:
                - Basics: kompletność danych (imię, email, telefon, lokalizacja, podsumowanie zawodowe)
                - Work: opisy obowiązków (konkretne, z mierzalnymi efektami), daty, progresja kariery
                - Education: kompletność (uczelnia, kierunek, stopień, daty)
                - Skills: ilość, różnorodność, dopasowanie do stanowiska docelowego
                - Languages: poziomy biegłości
                - Projects: opisy, linki, powiązanie z kompetencjami
                - Social: obecność LinkedIn, GitHub, portfolio
                - Certificates: aktualność, renoma wydawcy, dopasowanie do stanowiska docelowego

                WYMAGANY FORMAT JSON:
                {
                    "overallScore": 75,
                    "targetPositionScore": 60,
                    "sectionScores": [
                        {
                            "sectionName": "Work",
                            "score": 80,
                            "insights": ["Dodaj mierzalne efekty do opisu stanowiska", "Brak opisu obowiązków w jednej pozycji"]
                        }
                    ],
                    "topImprovements": ["Dodaj podsumowanie zawodowe", "Rozwiń opisy doświadczenia o konkretne liczby", "Dodaj link do portfolio"]
                }

                Jeśli sekcja jest pusta lub nie istnieje, daj score 0 i insight "Sekcja pusta — uzupełnij dane".
                {{positionContext}}
                CV DO ANALIZY:
                {{cvJson}}
                """;
        }
    }
}
