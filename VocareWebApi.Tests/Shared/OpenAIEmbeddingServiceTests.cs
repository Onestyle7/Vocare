using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.Shared.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Shared
{
    /// <summary>
    /// Testy jednostkowe <see cref="OpenAIEmbeddingService"/> – walidacja wejścia, obsługa błędów
    /// API oraz mapowanie odpowiedzi na wektory.
    /// </summary>
    public sealed class OpenAIEmbeddingServiceTests
    {
        private static OpenAIEmbeddingService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                new HttpClient(handler) { BaseAddress = new Uri("https://api.openai.com/v1/") },
                NullLogger<OpenAIEmbeddingService>.Instance
            );

        private static string EmbeddingResponse(params float[][] vectors)
        {
            var data = new List<object>();
            for (var i = 0; i < vectors.Length; i++)
                data.Add(new { index = i, embedding = vectors[i] });
            return JsonSerializer.Serialize(new { data });
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task GenerateEmbeddingAsync_WithEmptyText_ThrowsArgumentException(string? text)
        {
            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GenerateEmbeddingAsync(text!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task GenerateEmbeddingAsync_WhenApiReturnsError_ThrowsHttpRequestException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.TooManyRequests,
                "rate limit"
            );

            await CreateSut(handler)
                .Invoking(s => s.GenerateEmbeddingAsync("hello"))
                .Should()
                .ThrowAsync<HttpRequestException>();
        }

        [Fact]
        public async Task GenerateEmbeddingAsync_WhenResponseHasNoData_ThrowsInvalidOperation()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                JsonSerializer.Serialize(new { data = Array.Empty<object>() })
            );

            await CreateSut(handler)
                .Invoking(s => s.GenerateEmbeddingAsync("hello"))
                .Should()
                .ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task GenerateEmbeddingAsync_HappyPath_ReturnsVector()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                EmbeddingResponse(new[] { 0.1f, 0.2f, 0.3f })
            );

            var vector = await CreateSut(handler).GenerateEmbeddingAsync("hello");

            vector.ToArray().Should().Equal(0.1f, 0.2f, 0.3f);
        }

        [Fact]
        public async Task GenerateEmbeddingsAsync_WithEmptyList_ReturnsEmpty()
        {
            var handler = FakeHttpMessageHandler.Throwing(new InvalidOperationException("unused"));

            (await CreateSut(handler).GenerateEmbeddingsAsync(new List<string>()))
                .Should()
                .BeEmpty();
        }

        [Fact]
        public async Task GenerateEmbeddingsAsync_WithOnlyBlankStrings_ReturnsEmpty()
        {
            var handler = FakeHttpMessageHandler.Throwing(new InvalidOperationException("unused"));

            (await CreateSut(handler).GenerateEmbeddingsAsync(new List<string> { "", "   " }))
                .Should()
                .BeEmpty();
        }

        [Fact]
        public async Task GenerateEmbeddingsAsync_HappyPath_ReturnsVectorsOrderedByIndex()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                JsonSerializer.Serialize(
                    new
                    {
                        data = new[]
                        {
                            new { index = 1, embedding = new[] { 2f } },
                            new { index = 0, embedding = new[] { 1f } },
                        },
                    }
                )
            );

            var result = await CreateSut(handler)
                .GenerateEmbeddingsAsync(new List<string> { "a", "b" });

            result.Should().HaveCount(2);
            result[0].ToArray().Should().Equal(1f);
            result[1].ToArray().Should().Equal(2f);
        }
    }
}
