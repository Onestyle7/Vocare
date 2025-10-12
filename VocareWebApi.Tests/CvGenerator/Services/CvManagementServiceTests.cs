using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Repositories;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    public class CvManagementServiceTests
    {
        private readonly Mock<IGeneratedCvRepository> _mockCvRepo;
        private readonly Mock<IUserProfileRepository> _mockProfileRepo;
        private readonly Mock<ICvGenerationService> _mockCvGenService;
        private readonly Mock<ILogger<CvManagementService>> _mockLogger;
        private readonly CvManagementService _service;

        public CvManagementServiceTests()
        {
            // Inicjalizacja RAZ dla wszystkich testów
            _mockCvRepo = new Mock<IGeneratedCvRepository>();
            _mockProfileRepo = new Mock<IUserProfileRepository>();
            _mockCvGenService = new Mock<ICvGenerationService>();
            _mockLogger = new Mock<ILogger<CvManagementService>>();

            _service = new CvManagementService(
                _mockCvRepo.Object,
                _mockProfileRepo.Object,
                _mockCvGenService.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task CanCreateNewCvAsync_UserHas2Cvs_LimitIs3_ShouldReturnTrue()
        {
            // ARRANGE

            _mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(2);

            // ACT
            var result = await _service.CanCreateNewCvAsync("user-123");

            // ASSERT
            Assert.True(result);
        }

        [Fact]
        public async Task CanCreateNewCvAsync_UserHas3Cvs_LimitIs3_ShouldReturnFalse()
        {
            // ARRANGE
            _mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(3);

            // ACT
            var result = await _service.CanCreateNewCvAsync("user-123");

            // ASSERT
            Assert.False(result);
        }

        [Fact]
        public async Task CanCreateNewCvAsync_UserHas0Cvs_LimitIs3_ShouldReturnTrue()
        {
            // ARRANGE

            _mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(0);

            // ACT
            var result = await _service.CanCreateNewCvAsync("user-123");

            // ASSERT
            Assert.True(result);
        }

        [Fact]
        public async Task DeleteCvAsync_RegularCv_DeactivatesSuccessfully()
        {
            // ARRANGE
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            // Tworzymy CV, które nie jest domyślne
            var cv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Regular CV",
                IsDefault = false,
            };

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(cv);
            _mockCvRepo.Setup(r => r.DeactivateAsync(cvId)).ReturnsAsync(true);

            // ACT

            await _service.DeleteCvAsync(cvId, userId);

            // ASSERT
            _mockCvRepo.Verify(r => r.DeactivateAsync(cvId), Times.Once);

            _mockCvRepo.Verify(
                r => r.SetDefaultAsync(It.IsAny<Guid>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCvAsync_DefaultCv_DeletesAndSetsNewDefault()
        {
            // ARRANGE
            var userId = "user-123";
            var cvId = Guid.NewGuid();
            var otherCvId = Guid.NewGuid();

            // Tworzymy CV, które jest domyślne
            var defaultCv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Default CV",
                IsDefault = true,
            };
            var otherCv = new GeneratedCv
            {
                Id = otherCvId,
                UserId = userId,
                Name = "Other CV",
                IsDefault = false,
            };

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(defaultCv);
            _mockCvRepo
                .Setup(r => r.GetUserCvsAsync(userId))
                .ReturnsAsync(new List<GeneratedCv> { defaultCv, otherCv });
            _mockCvRepo.Setup(r => r.DeactivateAsync(cvId)).ReturnsAsync(true);

            // ACT
            await _service.DeleteCvAsync(cvId, userId);

            // ASSERT
            _mockCvRepo.Verify(r => r.DeactivateAsync(cvId), Times.Once);
            _mockCvRepo.Verify(
                r => r.SetDefaultAsync(It.IsAny<Guid>(), It.IsAny<string>()),
                Times.Once
            );
            _mockCvRepo.Verify(r => r.SetDefaultAsync(otherCvId, userId), Times.Once);
        }

        [Fact]
        public async Task DeleteCvAsync_CvDoesNotBelongToUser_ThrowsException()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(false);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                async () => await _service.DeleteCvAsync(cvId, userId)
            );
            Assert.Equal("CV nie należy do tego użytkownika", exception.Message);
        }

        [Fact]
        public async Task DeleteCvAsync_CvNotFound_ThrowsException()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync((GeneratedCv?)null);

            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                async () => await _service.DeleteCvAsync(cvId, userId)
            );

            Assert.Equal($"CV o ID {cvId} nie zostało znalezione", exception.Message);
        }

        [Fact]
        public async Task DeleteCvAsync_OnlyOneCv_DeletesWithoutSettingNewDefault()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            var cv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "Only CV",
                IsDefault = true,
            };

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(cv);
            _mockCvRepo
                .Setup(r => r.GetUserCvsAsync(userId))
                .ReturnsAsync(new List<GeneratedCv> { cv });
            _mockCvRepo.Setup(r => r.DeactivateAsync(cvId)).ReturnsAsync(true);

            // ACT
            await _service.DeleteCvAsync(cvId, userId);
            // ASSERT
            _mockCvRepo.Verify(r => r.DeactivateAsync(cvId), Times.Once);
            _mockCvRepo.Verify(
                r => r.SetDefaultAsync(It.IsAny<Guid>(), It.IsAny<string>()),
                Times.Never
            );
            _mockCvRepo.Verify(r => r.SetDefaultAsync(cvId, userId), Times.Never);
        }
    }
}
