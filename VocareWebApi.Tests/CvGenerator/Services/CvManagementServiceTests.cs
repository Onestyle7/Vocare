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

        private CvManagementService CreateService(
            Mock<IGeneratedCvRepository>? cvRepo = null,
            Mock<IUserProfileRepository>? profileRepo = null,
            Mock<ICvGenerationService>? cvGenService = null
        )
        {
            cvRepo ??= new Mock<IGeneratedCvRepository>();
            profileRepo ??= new Mock<IUserProfileRepository>();
            cvGenService ??= new Mock<ICvGenerationService>();
            var logger = new Mock<ILogger<CvManagementService>>();

            return new CvManagementService(
                cvRepo.Object,
                profileRepo.Object,
                cvGenService.Object,
                logger.Object
            );
        }

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
            var mockCvRepo = new Mock<IGeneratedCvRepository>();

            mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(2);

            var service = CreateService(cvRepo: mockCvRepo);

            // ACT
            var result = await service.CanCreateNewCvAsync("user-123");

            // ASSERT
            Assert.True(result);
        }

        [Fact]
        public async Task CanCreateNewCvAsync_UserHas3Cvs_LimitIs3_ShouldReturnFalse()
        {
            // ARRANGE
            var mockCvRepo = new Mock<IGeneratedCvRepository>();

            mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(3);

            var service = CreateService(cvRepo: mockCvRepo);

            // ACT
            var result = await service.CanCreateNewCvAsync("user-123");

            // ASSERT
            Assert.False(result);
        }

        [Fact]
        public async Task CanCreateNewCvAsync_UserHas0Cvs_LimitIs3_ShouldReturnTrue()
        {
            // ARRANGE
            var mockCvRepo = new Mock<IGeneratedCvRepository>();

            mockCvRepo.Setup(r => r.GetUserCvCountAsync("user-123")).ReturnsAsync(0);

            var service = CreateService(cvRepo: mockCvRepo);

            // ACT
            var result = await service.CanCreateNewCvAsync("user-123");

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
    }
}
