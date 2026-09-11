using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe walidacji wejścia w <see cref="CvParserService.ParseAndSaveAsync"/>
    /// (format pliku, rozmiar, limit importów dla darmowego planu).
    /// </summary>
    public sealed class CvParserServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<ICvParseHistoryRepository> _history = new();
        private readonly Mock<IUserBillingRepository> _billing = new();

        private CvParserService CreateSut() =>
            new(
                new HttpClient(
                    FakeHttpMessageHandler.Throwing(new System.InvalidOperationException())
                ),
                NullLogger<CvParserService>.Instance,
                _history.Object,
                userProfileService: null!,
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                _billing.Object
            );

        private static IFormFile File(string name, long length)
        {
            var file = new Mock<IFormFile>();
            file.Setup(f => f.FileName).Returns(name);
            file.Setup(f => f.Length).Returns(length);
            return file.Object;
        }

        [Fact]
        public async Task ParseAndSaveAsync_WithNonPdfFile_ThrowsUnsupportedFileFormat()
        {
            await CreateSut()
                .Invoking(s => s.ParseAndSaveAsync(File("resume.docx", 1024), UserId))
                .Should()
                .ThrowAsync<UnsupportedFileFormatException>();
        }

        [Fact]
        public async Task ParseAndSaveAsync_WithOversizedFile_ThrowsFileSizeExceeded()
        {
            await CreateSut()
                .Invoking(s => s.ParseAndSaveAsync(File("resume.pdf", 3 * 1024 * 1024), UserId))
                .Should()
                .ThrowAsync<FileSizeExceededException>();
        }

        [Fact]
        public async Task ParseAndSaveAsync_WhenFreeTierLimitReached_ThrowsCvImportLimitReached()
        {
            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.None,
                    }
                );
            _history.Setup(r => r.CountByUserIdAsync(UserId)).ReturnsAsync(1);

            await CreateSut()
                .Invoking(s => s.ParseAndSaveAsync(File("resume.pdf", 1024), UserId))
                .Should()
                .ThrowAsync<CvImportLimitReachedException>();
        }
    }
}
