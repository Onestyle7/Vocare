using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.CvGenerator.Exceptions;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Models.Entities;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Shared.Exceptions;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="CvAnalysisService"/> – kontrola dostępu do CV, obsługa
    /// odpowiedzi OpenAI oraz odczyt zapisanej analizy.
    /// </summary>
    public sealed class CvAnalysisServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<ICvAnalysisRepository> _analysisRepository = new();
        private readonly Mock<IGeneratedCvRepository> _cvRepository = new();

        private CvAnalysisService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                new HttpClient(handler),
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                _analysisRepository.Object,
                NullLogger<CvAnalysisService>.Instance,
                _cvRepository.Object
            );

        private static GeneratedCv Cv(Guid id) =>
            new()
            {
                Id = id,
                UserId = UserId,
                Version = 2,
                CvJson = JsonSerializer.Serialize(new CvDto()),
            };

        private static string ChatCompletion(string content) =>
            JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } });

        // ---------- AnalyzeCvAsync ----------

        [Fact]
        public async Task AnalyzeCvAsync_WhenCvMissing_ThrowsCvNotFound()
        {
            _cvRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((GeneratedCv?)null);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.AnalyzeCvAsync(Guid.NewGuid(), UserId))
                .Should()
                .ThrowAsync<CvNotFoundException>();
        }

        [Fact]
        public async Task AnalyzeCvAsync_WhenCvOwnedByAnotherUser_ThrowsAccessDenied()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(false);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.AnalyzeCvAsync(cvId, UserId))
                .Should()
                .ThrowAsync<CvAccessDeniedException>();
        }

        [Fact]
        public async Task AnalyzeCvAsync_WhenApiReturnsError_ThrowsAiServiceException()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.BadGateway, "err"))
                .Invoking(s => s.AnalyzeCvAsync(cvId, UserId))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task AnalyzeCvAsync_WhenNoChoices_ThrowsAiServiceException()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                JsonSerializer.Serialize(new { choices = Array.Empty<object>() })
            );

            await CreateSut(handler)
                .Invoking(s => s.AnalyzeCvAsync(cvId, UserId))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task AnalyzeCvAsync_HappyPath_SavesAnalysisAndReturnsResult()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            var analysisJson = JsonSerializer.Serialize(
                new
                {
                    overallScore = 78,
                    targetPositionScore = 65,
                    sectionScores = Array.Empty<object>(),
                    topImprovements = new[] { "Add a summary" },
                }
            );
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(analysisJson)
            );

            var result = await CreateSut(handler).AnalyzeCvAsync(cvId, UserId);

            result.OverallScore.Should().Be(78);
            result.TopImprovements.Should().ContainSingle().Which.Should().Be("Add a summary");
            _analysisRepository.Verify(
                r =>
                    r.SaveAsync(
                        It.Is<CvAnalysis>(a => a.CvId == cvId && a.CvVersionAtAnalysis == 2)
                    ),
                Times.Once
            );
        }

        // ---------- GetAnalysisAsync ----------

        [Fact]
        public async Task GetAnalysisAsync_WhenAnalysisMissing_ThrowsCvAnalysisNotFound()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            _analysisRepository.Setup(r => r.GetByCvIdAsync(cvId)).ReturnsAsync((CvAnalysis?)null);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GetAnalysisAsync(cvId, UserId))
                .Should()
                .ThrowAsync<CvAnalysisNotFoundException>();
        }

        [Fact]
        public async Task GetAnalysisAsync_DeserializesStoredResult()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            _analysisRepository
                .Setup(r => r.GetByCvIdAsync(cvId))
                .ReturnsAsync(
                    new CvAnalysis
                    {
                        CvId = cvId,
                        ResultJson = JsonSerializer.Serialize(new { overallScore = 90 }),
                    }
                );

            var result = await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .GetAnalysisAsync(cvId, UserId);

            result.OverallScore.Should().Be(90);
        }
    }
}
