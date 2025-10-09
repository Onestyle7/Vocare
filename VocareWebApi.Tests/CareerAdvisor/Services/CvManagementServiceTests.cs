using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Repositories;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    public class CvManagementServiceTests : IDisposable
    {
        private readonly Mock<IGeneratedCvRepository> _mockCvRepo;
        private readonly Mock<IUserProfileRepository> _mockUserProfileRepo;
        private readonly Mock<ICvGenerationService> _mockCvGenerationService;
        private readonly Mock<ILogger<CvManagementService>> _mockLogger;
        private readonly CvManagementService _service;

        // Stała definiująca limit CV dla darmowego konta
        private const int FREE_TIER_CV_LIMIT = 3;

        public CvManagementServiceTests()
        {
            // Arrange - inicjalizacja wszystkich mocków
            _mockCvRepo = new Mock<IGeneratedCvRepository>();
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockCvGenerationService = new Mock<ICvGenerationService>();
            _mockLogger = new Mock<ILogger<CvManagementService>>();

            // Tworzenie instancji serwisu z mockami
            _service = new CvManagementService(
                _mockCvRepo.Object,
                _mockUserProfileRepo.Object,
                _mockCvGenerationService.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task GetUserCvsAsync_UserHasExistingCvs_ReturnsListWithoutCreatingNew()
        {
            // Arrange
            var userId = "existing-user";
            var existingCvs = new List<GeneratedCv>
            {
                new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = "CV 1",
                    IsDefault = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    LastModifiedAt = DateTime.UtcNow.AddDays(-1),
                    Version = 2,
                    IsActive = true,
                },
                new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = "CV 2",
                    IsDefault = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    LastModifiedAt = DateTime.UtcNow.AddDays(-2),
                    Version = 1,
                    IsActive = true,
                },
            };

            _mockCvRepo.Setup(x => x.GetUserCvsAsync(userId)).ReturnsAsync(existingCvs);

            // Act
            var result = await _service.GetUserCvsAsync(userId);

            // Assert
            result.Should().HaveCount(2);
            result[0].Name.Should().Be("CV 1");
            result[1].Name.Should().Be("CV 2");

            // Weryfikacja, że nie utworzono nowego CV
            _mockCvGenerationService.Verify(
                x => x.GenerateCvAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
            _mockCvRepo.Verify(x => x.AddAsync(It.IsAny<GeneratedCv>()), Times.Never);
        }

        [Fact]
        public async Task CreateCvAsync_FromProfile_GeneratesCvSuccessfully()
        {
            // Arrange
            var userId = "test-user";
            var cvId = Guid.NewGuid();
            var createDto = new CreateCvDto
            {
                Name = "Developer CV",
                TargetPosition = "Senior Developer",
                CreateFromProfile = true,
                Notes = "CV for tech companies",
            };

            var generatedCvData = new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "john@example.com",
                    PhoneNumber = "123456789",
                    Summary = "Experienced developer",
                    Location = new CvLocationDto { City = "Warsaw", Country = "Poland" },
                },
                Skills = new List<string> { "C#", "JavaScript" },
            };

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(0);

            _mockCvGenerationService
                .Setup(x => x.GenerateCvAsync(userId, createDto.TargetPosition))
                .ReturnsAsync(generatedCvData);

            _mockCvRepo
                .Setup(x => x.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync(
                    (GeneratedCv cv) =>
                    {
                        cv.Id = cvId;
                        cv.CreatedAt = DateTime.UtcNow;
                        cv.LastModifiedAt = DateTime.UtcNow;
                        cv.Version = 1;
                        return cv;
                    }
                );

            // Act
            var result = await _service.CreateCvAsync(userId, createDto);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Developer CV");
            result.TargetPosition.Should().Be("Senior Developer");
            result.IsDefault.Should().BeTrue(); // Pierwsze CV powinno być domyślne
            result.Notes.Should().Be("CV for tech companies");
            result.CvData.Should().NotBeNull();
            result.CvData.Skills.Should().Contain("C#");
            result.CvData.Skills.Should().Contain("JavaScript");

            // Weryfikacja wywołań
            _mockCvGenerationService.Verify(
                x => x.GenerateCvAsync(userId, "Senior Developer"),
                Times.Once
            );
            _mockCvRepo.Verify(x => x.AddAsync(It.IsAny<GeneratedCv>()), Times.Once);
        }

        [Fact]
        public async Task CreateCvAsync_ExceedsLimit_ThrowsInvalidOperationException()
        {
            // Arrange
            var userId = "test-user";
            var createDto = new CreateCvDto { Name = "Another CV", CreateFromProfile = true };

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(FREE_TIER_CV_LIMIT); // Już osiągnięto limit

            // Act & Assert
            var action = async () => await _service.CreateCvAsync(userId, createDto);

            await action
                .Should()
                .ThrowAsync<InvalidOperationException>()
                .WithMessage(
                    $"Osiągnięto limit {FREE_TIER_CV_LIMIT} CV. Usuń istniejące CV lub ulepsz plan."
                );

            // Weryfikacja, że nie próbowano utworzyć CV
            _mockCvGenerationService.Verify(
                x => x.GenerateCvAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
            _mockCvRepo.Verify(x => x.AddAsync(It.IsAny<GeneratedCv>()), Times.Never);
        }

        [Fact]
        public async Task CreateCvAsync_WithInitialData_UsesProvidedData()
        {
            // Arrange
            var userId = "test-user";
            var providedCvData = new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = "Custom",
                    LastName = "Data",
                    Email = "custom@example.com",
                    PhoneNumber = "",
                    Summary = "",
                    Location = new CvLocationDto
                    {
                        City = "Custom City",
                        Country = "Custom Country",
                    },
                },
                Skills = new List<string> { "Custom Skill 1", "Custom Skill 2" },
            };

            var createDto = new CreateCvDto
            {
                Name = "Custom CV",
                CreateFromProfile = false,
                InitialData = providedCvData,
            };

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(1);

            _mockCvRepo
                .Setup(x => x.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            // Act
            var result = await _service.CreateCvAsync(userId, createDto);

            // Assert
            result.CvData.Basics!.FirstName.Should().Be("Custom");
            result.CvData.Basics.LastName.Should().Be("Data");
            result.IsDefault.Should().BeFalse(); // Nie pierwsze CV, więc nie domyślne

            // Weryfikacja, że nie generowano CV z profilu
            _mockCvGenerationService.Verify(
                x => x.GenerateCvAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task UpdateCvAsync_ValidUpdate_UpdatesSuccessfully()
        {
            // Arrange
            var userId = "test-user";
            var cvId = Guid.NewGuid();
            var updateDto = new UpdateCvDto
            {
                Id = cvId,
                Name = "Updated CV",
                TargetPosition = "Tech Lead",
                CvData = new CvDto
                {
                    Basics = new CvBasicsDto
                    {
                        FirstName = "Jane",
                        LastName = "Smith",
                        Email = "jane@example.com",
                        PhoneNumber = "",
                        Summary = "",
                        Location = new CvLocationDto { City = "", Country = "" },
                    },
                },
                Notes = "Updated notes",
            };

            var existingCv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Old CV",
                IsDefault = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Version = 1,
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);

            _mockCvRepo.Setup(x => x.GetByIdAsync(cvId)).ReturnsAsync(existingCv);

            _mockCvRepo
                .Setup(x => x.UpdateAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync(
                    (GeneratedCv cv) =>
                    {
                        cv.LastModifiedAt = DateTime.UtcNow;
                        cv.Version++;
                        return cv;
                    }
                );

            // Act
            var result = await _service.UpdateCvAsync(userId, updateDto);

            // Assert
            result.Name.Should().Be("Updated CV");
            result.TargetPosition.Should().Be("Tech Lead");
            result.CvData.Basics!.FirstName.Should().Be("Jane");
            result.Notes.Should().Be("Updated notes");
            result.Version.Should().BeGreaterThan(1);

            // Weryfikacja wywołań
            _mockCvRepo.Verify(
                x =>
                    x.UpdateAsync(
                        It.Is<GeneratedCv>(cv =>
                            cv.Name == "Updated CV" && cv.TargetPosition == "Tech Lead"
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task UpdateCvAsync_CvNotBelongsToUser_ThrowsUnauthorizedException()
        {
            // Arrange
            var userId = "test-user";
            var cvId = Guid.NewGuid();
            var updateDto = new UpdateCvDto
            {
                Id = cvId,
                Name = "Test",
                CvData = new CvDto(),
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvId, userId)).ReturnsAsync(false);

            // Act & Assert
            var action = async () => await _service.UpdateCvAsync(userId, updateDto);

            await action
                .Should()
                .ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("CV nie należy do tego użytkownika");
        }

        [Fact]
        public async Task DeleteCvAsync_IsDefaultCv_SetsAnotherAsDefault()
        {
            // Arrange
            var userId = "test-user";
            var cvIdToDelete = Guid.NewGuid();
            var otherCvId = Guid.NewGuid();

            var cvToDelete = new GeneratedCv
            {
                Id = cvIdToDelete,
                UserId = userId,
                IsDefault = true,
                Name = "Default CV",
            };

            var otherCv = new GeneratedCv
            {
                Id = otherCvId,
                UserId = userId,
                IsDefault = false,
                Name = "Other CV",
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvIdToDelete, userId)).ReturnsAsync(true);

            _mockCvRepo.Setup(x => x.GetByIdAsync(cvIdToDelete)).ReturnsAsync(cvToDelete);

            _mockCvRepo
                .Setup(x => x.GetUserCvsAsync(userId))
                .ReturnsAsync(new List<GeneratedCv> { cvToDelete, otherCv });

            _mockCvRepo
                .Setup(x => x.SetDefaultAsync(It.IsAny<Guid>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            _mockCvRepo.Setup(x => x.DeactivateAsync(It.IsAny<Guid>())).ReturnsAsync(true);

            // Act
            await _service.DeleteCvAsync(cvIdToDelete, userId);

            // Assert
            _mockCvRepo.Verify(x => x.SetDefaultAsync(otherCvId, userId), Times.Once);
            _mockCvRepo.Verify(x => x.DeactivateAsync(cvIdToDelete), Times.Once);
        }

        [Fact]
        public async Task GetCvDetailsAsync_ValidRequest_ReturnsCvDetails()
        {
            // Arrange
            var userId = "test-user";
            var cvId = Guid.NewGuid();
            var cvData = new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = "Test",
                    LastName = "User",
                    Email = "test@example.com",
                    PhoneNumber = "",
                    Summary = "",
                    Location = new CvLocationDto { City = "", Country = "" },
                },
            };

            var generatedCv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Test CV",
                TargetPosition = "Developer",
                CvJson = JsonSerializer.Serialize(
                    cvData,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
                ),
                IsDefault = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastModifiedAt = DateTime.UtcNow,
                Version = 2,
                Notes = "Test notes",
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);

            _mockCvRepo.Setup(x => x.GetByIdAsync(cvId)).ReturnsAsync(generatedCv);

            // Act
            var result = await _service.GetCvDetailsAsync(cvId, userId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(cvId);
            result.Name.Should().Be("Test CV");
            result.TargetPosition.Should().Be("Developer");
            result.CvData.Basics!.FirstName.Should().Be("Test");
            result.IsDefault.Should().BeTrue();
            result.Version.Should().Be(2);
            result.Notes.Should().Be("Test notes");
        }

        [Fact]
        public async Task CanCreateNewCvAsync_BelowLimit_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user";

            _mockCvRepo
                .Setup(x => x.GetUserCvCountAsync(userId))
                .ReturnsAsync(FREE_TIER_CV_LIMIT - 1);

            // Act
            var result = await _service.CanCreateNewCvAsync(userId);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task CanCreateNewCvAsync_AtLimit_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(FREE_TIER_CV_LIMIT);

            // Act
            var result = await _service.CanCreateNewCvAsync(userId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetMaxCvLimitAsync_ReturnsFreeTierLimit()
        {
            // Arrange
            var userId = "test-user";

            // Act
            var result = await _service.GetMaxCvLimitAsync(userId);

            // Assert
            result.Should().Be(FREE_TIER_CV_LIMIT);
        }

        public void Dispose()
        {
            // Cleanup jeśli potrzebne
        }
    }
}
