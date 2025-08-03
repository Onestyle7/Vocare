using System;
using System.Collections.Generic;
using System.Linq;
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

        public CvManagementServiceTests()
        {
            _mockCvRepo = new Mock<IGeneratedCvRepository>();
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockCvGenerationService = new Mock<ICvGenerationService>();
            _mockLogger = new Mock<ILogger<CvManagementService>>();

            _service = new CvManagementService(
                _mockCvRepo.Object,
                _mockUserProfileRepo.Object,
                _mockCvGenerationService.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task GetUserCvsAsync_UserHasNoCvs_CreatesInitialCv()
        {
            // Arrange
            var userId = "new-user";
            _mockCvRepo.Setup(x => x.GetUserCvsAsync(userId)).ReturnsAsync(new List<GeneratedCv>());

            var generatedCvData = new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "john@example.com",
                },
            };

            _mockCvGenerationService
                .Setup(x => x.GenerateCvAsync(userId, null))
                .ReturnsAsync(generatedCvData);

            _mockCvRepo
                .Setup(x => x.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(0);

            // Setup second call to return the created CV
            var createdCv = new GeneratedCv
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Moje pierwsze CV",
                IsDefault = true,
                CreatedAt = DateTime.UtcNow,
            };

            _mockCvRepo
                .SetupSequence(x => x.GetUserCvsAsync(userId))
                .ReturnsAsync(new List<GeneratedCv>())
                .ReturnsAsync(new List<GeneratedCv> { createdCv });

            // Act
            var result = await _service.GetUserCvsAsync(userId);

            // Assert
            result.Should().HaveCount(1);
            result[0].Name.Should().Be("Moje pierwsze CV");
            result[0].IsDefault.Should().BeTrue();

            _mockCvGenerationService.Verify(x => x.GenerateCvAsync(userId, null), Times.Once);
            _mockCvRepo.Verify(x => x.AddAsync(It.IsAny<GeneratedCv>()), Times.Once);
        }

        [Fact]
        public async Task CreateCvAsync_FromProfile_GeneratesCvSuccessfully()
        {
            // Arrange
            var userId = "test-user";
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
                },
                Skills = new List<string> { "C#", "JavaScript" },
            };

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(0);

            _mockCvGenerationService
                .Setup(x => x.GenerateCvAsync(userId, createDto.TargetPosition))
                .ReturnsAsync(generatedCvData);

            _mockCvRepo
                .Setup(x => x.AddAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            // Act
            var result = await _service.CreateCvAsync(userId, createDto);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Developer CV");
            result.TargetPosition.Should().Be("Senior Developer");
            result.IsDefault.Should().BeTrue(); // First CV should be default
            result.CvData.Skills.Should().Contain("C#");

            _mockCvGenerationService.Verify(
                x => x.GenerateCvAsync(userId, "Senior Developer"),
                Times.Once
            );
        }

        [Fact]
        public async Task CreateCvAsync_ExceedsLimit_ThrowsInvalidOperationException()
        {
            // Arrange
            var userId = "test-user";
            var createDto = new CreateCvDto { Name = "Another CV", CreateFromProfile = true };

            _mockCvRepo.Setup(x => x.GetUserCvCountAsync(userId)).ReturnsAsync(3); // Already at limit

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateCvAsync(userId, createDto)
            );

            exception.Message.Should().Contain("Osiągnięto limit 3 CV");
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
                    Basics = new CvBasicsDto { FirstName = "Jane", LastName = "Smith" },
                },
            };

            var existingCv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Old CV",
                IsDefault = true,
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);

            _mockCvRepo.Setup(x => x.GetByIdAsync(cvId)).ReturnsAsync(existingCv);

            _mockCvRepo
                .Setup(x => x.UpdateAsync(It.IsAny<GeneratedCv>()))
                .ReturnsAsync((GeneratedCv cv) => cv);

            // Act
            var result = await _service.UpdateCvAsync(userId, updateDto);

            // Assert
            result.Name.Should().Be("Updated CV");
            result.TargetPosition.Should().Be("Tech Lead");
            result.CvData.Basics!.FirstName.Should().Be("Jane");

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
            };

            var otherCv = new GeneratedCv
            {
                Id = otherCvId,
                UserId = userId,
                IsDefault = false,
            };

            _mockCvRepo.Setup(x => x.BelongsToUserAsync(cvIdToDelete, userId)).ReturnsAsync(true);

            _mockCvRepo.Setup(x => x.GetByIdAsync(cvIdToDelete)).ReturnsAsync(cvToDelete);

            _mockCvRepo
                .Setup(x => x.GetUserCvsAsync(userId))
                .ReturnsAsync(new List<GeneratedCv> { cvToDelete, otherCv });

            // Act
            await _service.DeleteCvAsync(cvIdToDelete, userId);

            // Assert
            _mockCvRepo.Verify(x => x.SetDefaultAsync(otherCvId, userId), Times.Once);
            _mockCvRepo.Verify(x => x.DeactivateAsync(cvIdToDelete), Times.Once);
        }

        public void Dispose()
        {
            // Cleanup if needed
        }
    }
}
