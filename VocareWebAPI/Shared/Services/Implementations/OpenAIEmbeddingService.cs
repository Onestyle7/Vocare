using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Pgvector;
using Pgvector.Npgsql;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.Shared.Services.Implementations
{
    public class OpenAIEmbeddingService : IEmbeddingService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OpenAIEmbeddingService> _logger;

        //TODO: przenieść do appsettings
        private const string EmbeddingModel = "text-embedding-3-small";

        public OpenAIEmbeddingService(HttpClient httpClient, ILogger<OpenAIEmbeddingService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            _logger.LogInformation(
                "Open Ai embeddingService zainicjalizowany z modelem {Model}",
                EmbeddingModel
            );
        }

        public async Task<Vector> GenerateEmbeddingAsync(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                _logger.LogInformation("Próba wygenerowania embeddingu dla pustego tesktu");
                throw new ArgumentException("Tekst nie może być pusty", nameof(text));
            }

            var truncatedText = text.Length > 8000 ? text[..8000] : text;

            _logger.LogDebug(
                "Generuję embedding dla tekstu o długości {Length} znaków",
                truncatedText.Length
            );

            try
            {
                var request = new EmbeddingRequest
                {
                    Model = EmbeddingModel,
                    Input = truncatedText,
                };

                var response = await _httpClient.PostAsJsonAsync("embeddings", request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError(
                        "OpenAI API zwróciło błąd {statusCode}: {Error}",
                        response.StatusCode,
                        errorContent
                    );

                    throw new HttpRequestException(
                        $"OpenAI API error: {response.StatusCode} - {errorContent}"
                    );
                }

                var result = await response.Content.ReadFromJsonAsync<EmbeddingResponse>();

                if (result?.Data == null || result.Data.Count == 0)
                {
                    throw new InvalidOperationException("Open AI nie zwróciło embeddingu");
                }

                var embeddingData = result.Data[0].Embedding;

                _logger.LogDebug(
                    "Wygenerowano embedding o wymiarach: {Dimensions}",
                    embeddingData.Length
                );

                return new Vector(embeddingData);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Błąd HTTP podczas generowania embeddingu");
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Błąd parsowania odpowiedzi z OpenAI");
                throw new InvalidOperationException("Nie można sparsować odpowiedzi z OpenAI", ex);
            }
        }

        public async Task<IList<Vector>> GenerateEmbeddingsAsync(IList<string> texts)
        {
            if (texts == null || texts.Count == 0)
            {
                return new List<Vector>();
            }

            var processedTexts = texts
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Length > 8000 ? t[..8000] : t)
                .ToList();

            if (processedTexts.Count == 0)
            {
                _logger.LogWarning("Wszystkie teksty w batchu były puste");
                return new List<Vector>();
            }

            _logger.LogInformation(
                "Generuję embeddingi dla batcha {Count} tekstów",
                processedTexts.Count
            );

            try
            {
                var request = new EmbeddingBatchRequest
                {
                    Model = EmbeddingModel,
                    Input = processedTexts,
                };

                var response = await _httpClient.PostAsJsonAsync("embeddings", request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();

                    _logger.LogInformation(
                        "OpenAI PAI batch error {StatusCode}: {Error}",
                        response.StatusCode,
                        errorContent
                    );

                    throw new HttpRequestException($"OpenAI API error: {response.StatusCode}");
                }

                var result = await response.Content.ReadFromJsonAsync<EmbeddingResponse>();

                if (result?.Data == null)
                {
                    throw new InvalidOperationException("OpenAI nie zwróciło embeddingu");
                }

                var vectors = result
                    .Data.OrderBy(d => d.Index)
                    .Select(d => new Vector(d.Embedding))
                    .ToList();

                _logger.LogInformation("Wygenerowano {Count} embeddingów", vectors.Count);

                return vectors;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas generowania batch embeddingów");
                throw;
            }
        }

        #region DTO klasy dla OPENAI API
        private class EmbeddingRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = "";

            [JsonPropertyName("input")]
            public string Input { get; set; } = "";
        }

        private class EmbeddingBatchRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = "";

            [JsonPropertyName("input")]
            public IList<string> Input { get; set; } = new List<string>();
        }

        private class EmbeddingResponse
        {
            [JsonPropertyName("data")]
            public List<EmbeddingData> Data { get; set; } = new();

            [JsonPropertyName("model")]
            public string Model { get; set; } = "";

            [JsonPropertyName("usage")]
            public UsageInfo? Usage { get; set; }
        }

        private class EmbeddingData
        {
            [JsonPropertyName("index")]
            public int Index { get; set; }

            [JsonPropertyName("embedding")]
            public float[] Embedding { get; set; } = Array.Empty<float>();
        }

        private class UsageInfo
        {
            [JsonPropertyName("prompt_tokens")]
            public int PromptTokens { get; set; }

            [JsonPropertyName("total_tokens")]
            public int TotalTokens { get; set; }
        }

        #endregion
    }
}
