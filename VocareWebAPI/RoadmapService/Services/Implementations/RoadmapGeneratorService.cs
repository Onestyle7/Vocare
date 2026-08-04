using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebAPI.RoadmapService.Services.Prompts;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Services.Implementations
{
    public class RoadmapGeneratorService : IRoadmapGeneratorService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly ILogger<RoadmapGeneratorService> _logger;

        public RoadmapGeneratorService(
            HttpClient httpClient,
            IOptions<OpenAIConfig> config,
            ILogger<RoadmapGeneratorService> logger
        )
        {
            _httpClient = httpClient;
            _config = config.Value;
            _logger = logger;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<GeneratedRoadmapDto> GenerateAsync(RoadmapGenerationRequest request)
        {
            var systemPrompt = RoadmapPromptBuilder.BuildSystemPrompt();
            var userPrompt = RoadmapPromptBuilder.BuildUserPrompt(request);

            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt },
                },
                response_format = new { type = "json_object" }
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
                        "OpenAI API error: {StatusCode} - {Content}",
                        response.StatusCode,
                        responseContent
                    );
                    throw new AiServiceException(
                        "Failed to generate roadmap. Please try again later."
                    );
                }

                using var document = JsonDocument.Parse(responseContent);
                var roadmapJson = document
                    .RootElement.GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                var roadmapDto = JsonSerializer.Deserialize<GeneratedRoadmapDto>(
                    roadmapJson!,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (
                    roadmapDto == null
                    || string.IsNullOrEmpty(roadmapDto.Title)
                    || roadmapDto.Phases == null
                    || !roadmapDto.Phases.Any()
                )
                {
                    _logger.LogError(
                        $"OpenAI API returned invalid roadmap format: {responseContent}"
                    );
                    throw new AiServiceException(
                        "Received invalid roadmap format. Please try again."
                    );
                }

                return roadmapDto;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error comunicating with OpenAI API");
                throw new AiServiceException("Błąd komunikacji z API", ex);
            }
        }
    }
}
