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
using VocareWebAPI.CvGenerator.Implementations;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Shared.Exceptions;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Exceptions;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="CvTailoringService"/> – dopasowanie istniejącego CV do oferty
    /// (kontrola właściciela, wywołanie OpenAI, zapis) oraz reguły limitu przy generowaniu z profilu.
    /// </summary>
    public sealed class CvTailoringServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IGeneratedCvRepository> _cvRepository = new();
        private readonly Mock<IUserProfileRepository> _profiles = new();
        private readonly Mock<ICvManagementService> _cvManagement = new();

        private CvTailoringService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                new HttpClient(handler),
                _cvRepository.Object,
                NullLogger<CvTailoringService>.Instance,
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                _profiles.Object,
                _cvManagement.Object,
                userProfileService: null!
            );

        private static GeneratedCv Cv(Guid id) =>
            new()
            {
                Id = id,
                UserId = UserId,
                Name = "My CV",
                CvJson = JsonSerializer.Serialize(new CvDto()),
            };

        private static string ChatCompletion(object cvPayload) =>
            JsonSerializer.Serialize(
                new
                {
                    choices = new[]
                    {
                        new { message = new { content = JsonSerializer.Serialize(cvPayload) } },
                    },
                }
            );

        // ---------- TailorCvAsync ----------

        [Fact]
        public async Task TailorCvAsync_WhenCvMissing_ThrowsCvNotFound()
        {
            _cvRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((GeneratedCv?)null);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.TailorCvAsync(new TailorCvDto { CvId = Guid.NewGuid() }, UserId))
                .Should()
                .ThrowAsync<CvNotFoundException>();
        }

        [Fact]
        public async Task TailorCvAsync_WhenNotOwner_ThrowsAccessDenied()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(false);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.TailorCvAsync(new TailorCvDto { CvId = cvId }, UserId))
                .Should()
                .ThrowAsync<CvAccessDeniedException>();
        }

        [Fact]
        public async Task TailorCvAsync_WhenApiFails_ThrowsAiServiceException()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);

            await CreateSut(
                    FakeHttpMessageHandler.Returning(HttpStatusCode.InternalServerError, "x")
                )
                .Invoking(s =>
                    s.TailorCvAsync(
                        new TailorCvDto { CvId = cvId, JobDescription = "Backend role" },
                        UserId
                    )
                )
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task TailorCvAsync_HappyPath_PersistsTailoredCvAndReturnsDetails()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(Cv(cvId));
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            _cvRepository
                .Setup(r => r.UpdateAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv c) => c);
            var tailored = new
            {
                basics = new { firstName = "Ada", lastName = "Byron" },
                skills = new[] { "C#" },
            };
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(tailored)
            );

            var result = await CreateSut(handler)
                .TailorCvAsync(
                    new TailorCvDto { CvId = cvId, JobDescription = "Backend role" },
                    UserId
                );

            result.Id.Should().Be(cvId);
            result.CvData.Basics.FirstName.Should().Be("Ada");
            _cvRepository.Verify(r => r.UpdateAsync(It.IsAny<GeneratedCv>()), Times.Once);
        }

        // ---------- GenerateCvFromProfileAsync ----------

        [Fact]
        public async Task GenerateCvFromProfileAsync_WhenProfileMissing_ThrowsUserProfileNotFound()
        {
            _profiles
                .Setup(p => p.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync((UserProfile)null!);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s =>
                    s.GenerateCvFromProfileAsync(
                        new GenerateCvFromProfileDto { JobDescription = "role" },
                        UserId
                    )
                )
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task GenerateCvFromProfileAsync_WhenLimitReached_ReturnsFailure()
        {
            _profiles
                .Setup(p => p.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(new UserProfile { UserId = UserId });
            _cvManagement.Setup(m => m.CanCreateNewCvAsync(UserId)).ReturnsAsync(false);

            var result = await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .GenerateCvFromProfileAsync(
                    new GenerateCvFromProfileDto { JobDescription = "role" },
                    UserId
                );

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("CV_LIMIT_REACHED");
            _cvRepository.Verify(r => r.AddAsync(It.IsAny<GeneratedCv>()), Times.Never);
        }
    }
}
