using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Exceptions;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="CvManagementService"/> – limity CV, kontrola właściciela,
    /// tworzenie/aktualizacja/usuwanie oraz zarządzanie domyślnym CV.
    /// </summary>
    public sealed class CvManagementServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IGeneratedCvRepository> _cvRepository = new();
        private readonly Mock<ICvGenerationService> _generation = new();
        private readonly Mock<IUserBillingRepository> _billing = new();
        private readonly CvManagementService _sut;

        public CvManagementServiceTests()
        {
            _billing
                .Setup(b => b.GetByUserIdAsync(UserId))
                .ReturnsAsync(new UserBilling { UserId = UserId });
            _sut = new CvManagementService(
                _cvRepository.Object,
                _generation.Object,
                NullLogger<CvManagementService>.Instance,
                _billing.Object,
                Options.Create(new CvLimitsConfig { FreeTierLimit = 3, PremiumTierLimit = 25 })
            );
        }

        private static GeneratedCv Cv(
            Guid? id = null,
            string userId = UserId,
            bool isDefault = false,
            string? cvJson = null
        ) =>
            new()
            {
                Id = id ?? Guid.NewGuid(),
                UserId = userId,
                Name = "My CV",
                IsDefault = isDefault,
                CvJson = cvJson ?? JsonSerializer.Serialize(new CvDto()),
            };

        // ---------- GetMaxCvLimitAsync ----------

        [Fact]
        public async Task GetMaxCvLimitAsync_WithActiveSubscription_ReturnsPremiumLimit()
        {
            _billing
                .Setup(b => b.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.Active,
                    }
                );

            (await _sut.GetMaxCvLimitAsync(UserId)).Should().Be(25);
        }

        [Fact]
        public async Task GetMaxCvLimitAsync_WithoutSubscription_ReturnsFreeLimit()
        {
            (await _sut.GetMaxCvLimitAsync(UserId)).Should().Be(3);
        }

        // ---------- CanCreateNewCvAsync ----------

        [Theory]
        [InlineData(2, true)]
        [InlineData(3, false)]
        [InlineData(5, false)]
        public async Task CanCreateNewCvAsync_ComparesCountToLimit(int count, bool expected)
        {
            _cvRepository.Setup(r => r.GetUserCvCountAsync(UserId)).ReturnsAsync(count);

            (await _sut.CanCreateNewCvAsync(UserId)).Should().Be(expected);
        }

        // ---------- GetUserCvsAsync ----------

        [Fact]
        public async Task GetUserCvsAsync_MapsEntitiesToListItems()
        {
            _cvRepository
                .Setup(r => r.GetUserCvsAsync(UserId))
                .ReturnsAsync(new List<GeneratedCv> { Cv(isDefault: true), Cv() });

            var result = await _sut.GetUserCvsAsync(UserId);

            result.Should().HaveCount(2);
            result[0].Name.Should().Be("My CV");
        }

        // ---------- GetCvDetailsAsync ----------

        [Fact]
        public async Task GetCvDetailsAsync_WhenMissing_ThrowsCvNotFound()
        {
            _cvRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((GeneratedCv?)null);

            await _sut.Invoking(s => s.GetCvDetailsAsync(Guid.NewGuid(), UserId))
                .Should()
                .ThrowAsync<CvNotFoundException>();
        }

        [Fact]
        public async Task GetCvDetailsAsync_WhenOwnedByAnotherUser_ThrowsAccessDenied()
        {
            var cv = Cv(userId: "someone-else");
            _cvRepository.Setup(r => r.GetByIdAsync(cv.Id)).ReturnsAsync(cv);

            await _sut.Invoking(s => s.GetCvDetailsAsync(cv.Id, UserId))
                .Should()
                .ThrowAsync<CvAccessDeniedException>();
        }

        [Fact]
        public async Task GetCvDetailsAsync_DeserializesStoredJson()
        {
            var cvDto = new CvDto
            {
                Skills = new List<string> { "C#", "SQL" },
            };
            var cv = Cv(cvJson: JsonSerializer.Serialize(cvDto, CamelCase));
            _cvRepository.Setup(r => r.GetByIdAsync(cv.Id)).ReturnsAsync(cv);

            var result = await _sut.GetCvDetailsAsync(cv.Id, UserId);

            result.CvData.Skills.Should().BeEquivalentTo(new[] { "C#", "SQL" });
        }

        // ---------- CreateCvAsync ----------

        [Fact]
        public async Task CreateCvAsync_WhenLimitReached_ReturnsFailure()
        {
            _cvRepository.Setup(r => r.GetUserCvCountAsync(UserId)).ReturnsAsync(3);

            var result = await _sut.CreateCvAsync(UserId, new CreateCvDto { Name = "CV" });

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("CV_LIMIT_REACHED");
            _cvRepository.Verify(r => r.AddAsync(It.IsAny<GeneratedCv>()), Times.Never);
        }

        [Fact]
        public async Task CreateCvAsync_FromProfile_UsesGenerationServiceAndMarksFirstCvAsDefault()
        {
            _cvRepository.Setup(r => r.GetUserCvCountAsync(UserId)).ReturnsAsync(0);
            _generation
                .Setup(g => g.GenerateCvAsync(UserId, "Backend Developer"))
                .ReturnsAsync(new CvDto { Skills = new List<string> { "C#" } });
            _cvRepository
                .Setup(r => r.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            var result = await _sut.CreateCvAsync(
                UserId,
                new CreateCvDto
                {
                    Name = "Backend CV",
                    TargetPosition = "Backend Developer",
                    CreateFromProfile = true,
                }
            );

            result.IsSuccess.Should().BeTrue();
            result.Value!.IsDefault.Should().BeTrue();
            _generation.Verify(g => g.GenerateCvAsync(UserId, "Backend Developer"), Times.Once);
        }

        [Fact]
        public async Task CreateCvAsync_WithInitialData_DoesNotCallGenerationService()
        {
            _cvRepository.Setup(r => r.GetUserCvCountAsync(UserId)).ReturnsAsync(1);
            _cvRepository
                .Setup(r => r.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            var result = await _sut.CreateCvAsync(
                UserId,
                new CreateCvDto
                {
                    Name = "Manual CV",
                    CreateFromProfile = false,
                    InitialData = new CvDto { Skills = new List<string> { "Figma" } },
                }
            );

            result.IsSuccess.Should().BeTrue();
            result.Value!.IsDefault.Should().BeFalse();
            _generation.Verify(
                g => g.GenerateCvAsync(It.IsAny<string>(), It.IsAny<string?>()),
                Times.Never
            );
        }

        // ---------- UpdateCvAsync ----------

        [Fact]
        public async Task UpdateCvAsync_WhenMissing_ThrowsCvNotFound()
        {
            _cvRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((GeneratedCv?)null);

            await _sut.Invoking(s =>
                    s.UpdateCvAsync(UserId, new UpdateCvDto { Id = Guid.NewGuid(), Name = "x" })
                )
                .Should()
                .ThrowAsync<CvNotFoundException>();
        }

        [Fact]
        public async Task UpdateCvAsync_PersistsChangesThroughRepository()
        {
            var cv = Cv();
            _cvRepository.Setup(r => r.GetByIdAsync(cv.Id)).ReturnsAsync(cv);
            _cvRepository
                .Setup(r => r.UpdateAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv c) => c);

            var result = await _sut.UpdateCvAsync(
                UserId,
                new UpdateCvDto
                {
                    Id = cv.Id,
                    Name = "Renamed",
                    CvData = new CvDto(),
                }
            );

            result.Name.Should().Be("Renamed");
            _cvRepository.Verify(
                r => r.UpdateAsync(It.Is<GeneratedCv>(c => c.Name == "Renamed")),
                Times.Once
            );
        }

        // ---------- DeleteCvAsync ----------

        [Fact]
        public async Task DeleteCvAsync_WhenOwnedByAnotherUser_ThrowsAccessDenied()
        {
            var cv = Cv(userId: "other");
            _cvRepository.Setup(r => r.GetByIdAsync(cv.Id)).ReturnsAsync(cv);

            await _sut.Invoking(s => s.DeleteCvAsync(cv.Id, UserId))
                .Should()
                .ThrowAsync<CvAccessDeniedException>();
        }

        [Fact]
        public async Task DeleteCvAsync_WhenDeletingDefault_PromotesAnotherCvThenDeactivates()
        {
            var target = Cv(isDefault: true);
            var other = Cv();
            _cvRepository.Setup(r => r.GetByIdAsync(target.Id)).ReturnsAsync(target);
            _cvRepository
                .Setup(r => r.GetUserCvsAsync(UserId))
                .ReturnsAsync(new List<GeneratedCv> { target, other });
            _cvRepository
                .Setup(r => r.SetDefaultAsync(other.Id, UserId))
                .Returns(Task.CompletedTask);
            _cvRepository.Setup(r => r.DeactivateAsync(target.Id)).ReturnsAsync(true);

            await _sut.DeleteCvAsync(target.Id, UserId);

            _cvRepository.Verify(r => r.SetDefaultAsync(other.Id, UserId), Times.Once);
            _cvRepository.Verify(r => r.DeactivateAsync(target.Id), Times.Once);
        }

        // ---------- SetDefaultCvAsync ----------

        [Fact]
        public async Task SetDefaultCvAsync_WhenNotOwner_ThrowsAccessDenied()
        {
            _cvRepository
                .Setup(r => r.BelongsToUserAsync(It.IsAny<Guid>(), UserId))
                .ReturnsAsync(false);

            await _sut.Invoking(s => s.SetDefaultCvAsync(UserId, Guid.NewGuid()))
                .Should()
                .ThrowAsync<CvAccessDeniedException>();
        }

        [Fact]
        public async Task SetDefaultCvAsync_WhenOwner_DelegatesToRepository()
        {
            var cvId = Guid.NewGuid();
            _cvRepository.Setup(r => r.BelongsToUserAsync(cvId, UserId)).ReturnsAsync(true);
            _cvRepository.Setup(r => r.SetDefaultAsync(cvId, UserId)).Returns(Task.CompletedTask);

            await _sut.SetDefaultCvAsync(UserId, cvId);

            _cvRepository.Verify(r => r.SetDefaultAsync(cvId, UserId), Times.Once);
        }

        private static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };
    }
}
