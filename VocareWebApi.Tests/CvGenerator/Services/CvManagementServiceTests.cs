using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.VisualBasic;
using Moq;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
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

        [Fact]
        public async Task GetUserCvsAsync_UserHas2Cvs_ReturnsCvs()
        {
            //Arrange
            var userId = "user-123";
            var cvId1 = Guid.NewGuid();
            var cvId2 = Guid.NewGuid();
            var createdDate = DateTime.UtcNow.AddDays(-5);
            var modifiedDate = DateTime.UtcNow.AddDays(-1);
            var cvs = new List<GeneratedCv>
            {
                new GeneratedCv
                {
                    Id = cvId1,
                    UserId = userId,
                    Name = "CV 1",
                    IsDefault = true,
                    Version = 1,
                    CreatedAt = createdDate,
                    LastModifiedAt = modifiedDate,
                },
                new GeneratedCv
                {
                    Id = cvId2,
                    UserId = userId,
                    Name = "CV 2",
                    IsDefault = false,
                    Version = 2,
                    CreatedAt = createdDate,
                    LastModifiedAt = modifiedDate,
                },
            };

            _mockCvRepo.Setup(r => r.GetUserCvsAsync(userId)).ReturnsAsync(cvs);

            //Act
            var result = await _service.GetUserCvsAsync(userId);

            //Assert
            Assert.Equal(2, result.Count);
            var cv1 = result.First(cv => cv.Id == cvId1);
            Assert.Equal(cvId1, cv1.Id);
            Assert.Equal("CV 1", cv1.Name);
            Assert.True(cv1.IsDefault);
            Assert.Equal(1, cv1.Version);
            Assert.Equal(createdDate, cv1.CreatedAt);
            Assert.Equal(modifiedDate, cv1.LastModifiedAt);
            var cv2 = result.First(cv => cv.Id == cvId2);
            Assert.Equal(cvId2, cv2.Id);
            Assert.Equal("CV 2", cv2.Name);
            Assert.False(cv2.IsDefault);
            Assert.Equal(2, cv2.Version);
            Assert.Equal(createdDate, cv2.CreatedAt);
            Assert.Equal(modifiedDate, cv2.LastModifiedAt);

            _mockCvRepo.Verify(r => r.GetUserCvsAsync(userId), Times.Once);
        }

        [Fact]
        public async Task GetUserCvsAsync_UserHas0Cvs_ReturnsEmptyList()
        {
            //Arrange
            var userId = "user-123";

            _mockCvRepo.Setup(r => r.GetUserCvsAsync(userId)).ReturnsAsync(new List<GeneratedCv>());

            //Act
            var result = await _service.GetUserCvsAsync(userId);

            //Assert
            Assert.Empty(result);
            _mockCvRepo.Verify(r => r.GetUserCvsAsync(userId), Times.Once);
        }

        [Fact]
        public async Task GetUserCvsAsync_UserHas1Cv_ReturnsSingleCv()
        {
            //Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();
            var createdDate = DateTime.UtcNow.AddDays(-5);
            var modifiedDate = DateTime.UtcNow.AddDays(-1);

            var cvs = new List<GeneratedCv>
            {
                new GeneratedCv
                {
                    Id = cvId,
                    UserId = userId,
                    Name = "CV 1",
                    IsDefault = true,
                    Version = 1,
                    CreatedAt = createdDate,
                    LastModifiedAt = modifiedDate,
                },
            };

            _mockCvRepo.Setup(r => r.GetUserCvsAsync(userId)).ReturnsAsync(cvs);

            //Act
            var result = await _service.GetUserCvsAsync(userId);
            //Assert
            Assert.Equal(1, result.Count);
            var cv1 = result.First(cv => cv.Id == cvId);
            Assert.Equal(cvId, cv1.Id);
            Assert.Equal("CV 1", cv1.Name);
            Assert.True(cv1.IsDefault);
            Assert.Equal(1, cv1.Version);
            Assert.Equal(createdDate, cv1.CreatedAt);
            Assert.Equal(modifiedDate, cv1.LastModifiedAt);

            _mockCvRepo.Verify(r => r.GetUserCvsAsync(userId), Times.Once);
        }

        [Fact]
        public async Task GetCvDetailsAsync_ValidCvAndUser_ReturnsCvDetails()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();
            var createdDate = DateTime.UtcNow.AddDays(-10);
            var modifiedDate = DateTime.UtcNow.AddDays(-2);

            var cvData = new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = "John",
                    LastName = "Doe",
                    PhoneNumber = "123456789",
                    Email = "johon@example.com",
                    Summary = "Experienced software developer.",
                    Location = new CvLocationDto { City = "New York", Country = "USA" },
                },
                Work = new List<CvWorkEntryDto>
                {
                    new CvWorkEntryDto
                    {
                        Company = "Tech Corp",
                        Position = "Senior Developer",
                        StartDate = "2020-01-01",
                        EndDate = "Present",
                        Description = "Leading a team of developers.",
                    },
                },
                Education = new List<CvEducationEntryDto>
                {
                    new CvEducationEntryDto
                    {
                        Institution = "State University",
                        Field = "Computer Science",
                        Degree = "Bachelor's",
                        StartDate = "2015-09-01",
                        EndDate = "2019-06-30",
                    },
                },
                Certificates = new List<CvCertificateEntryDto>(),
                Skills = new List<string> { "C#", ".NET", "SQL" },
                Languages = new List<CvLanguageEntryDto>(),
            };
            var cvJson = JsonSerializer.Serialize(
                cvData,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var cv = new GeneratedCv
            {
                Id = cvId,
                UserId = userId,
                Name = "My CV",
                TargetPosition = "Software Engineer",
                IsDefault = true,
                CvJson = cvJson, // ← Tu jest nasz JSON!
                CreatedAt = createdDate,
                LastModifiedAt = modifiedDate,
                Version = 3,
                Notes = "Important CV",
            };

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync(cv);

            // Act
            var result = await _service.GetCvDetailsAsync(cvId, userId);

            // Assert
            Assert.NotNull(result);

            Assert.Equal(cvId, result.Id);
            Assert.Equal("My CV", result.Name);
            Assert.Equal("Software Engineer", result.TargetPosition);
            Assert.True(result.IsDefault);
            Assert.Equal(createdDate, result.CreatedAt);
            Assert.Equal(modifiedDate, result.LastModifiedAt);
            Assert.Equal(3, result.Version);
            Assert.Equal("Important CV", result.Notes);

            Assert.NotNull(result.CvData);
            Assert.Equal("John", result.CvData.Basics.FirstName);
            Assert.Equal("Doe", result.CvData.Basics.LastName);
            Assert.Equal("123456789", result.CvData.Basics.PhoneNumber);
            Assert.Equal("johon@example.com", result.CvData.Basics.Email);
            Assert.Equal("Experienced software developer.", result.CvData.Basics.Summary);
            Assert.Equal("New York", result.CvData.Basics.Location.City);
            Assert.Equal("USA", result.CvData.Basics.Location.Country);
            Assert.Single(result.CvData.Work);
            Assert.Equal("Tech Corp", result.CvData.Work[0].Company);
            Assert.Equal("Senior Developer", result.CvData.Work[0].Position);
            Assert.Equal("2020-01-01", result.CvData.Work[0].StartDate);
            Assert.Equal("Present", result.CvData.Work[0].EndDate);
            Assert.Equal("Leading a team of developers.", result.CvData.Work[0].Description);
            Assert.Single(result.CvData.Education);
            Assert.Equal("State University", result.CvData.Education[0].Institution);
            Assert.Equal("Computer Science", result.CvData.Education[0].Field);
            Assert.Equal("Bachelor's", result.CvData.Education[0].Degree);
            Assert.Equal("2015-09-01", result.CvData.Education[0].StartDate);
            Assert.Equal("2019-06-30", result.CvData.Education[0].EndDate);
            Assert.Empty(result.CvData.Certificates);
            Assert.Equal(3, result.CvData.Skills.Count);
            Assert.Empty(result.CvData.Languages);

            _mockCvRepo.Verify(r => r.BelongsToUserAsync(cvId, userId), Times.Once);
            _mockCvRepo.Verify(r => r.GetByIdAsync(cvId), Times.Once);
        }

        [Fact]
        public async Task GetCvDetailsAsync_CvDoesNotBelongToUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(false);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                async () => await _service.GetCvDetailsAsync(cvId, userId)
            );

            Assert.Equal("You do not have permission to access this CV.", exception.Message);
            _mockCvRepo.Verify(r => r.BelongsToUserAsync(cvId, userId), Times.Once);
            _mockCvRepo.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task GetCvDetailsAsync_CvNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var userId = "user-123";
            var cvId = Guid.NewGuid();

            _mockCvRepo.Setup(r => r.BelongsToUserAsync(cvId, userId)).ReturnsAsync(true);
            _mockCvRepo.Setup(r => r.GetByIdAsync(cvId)).ReturnsAsync((GeneratedCv?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                async () => await _service.GetCvDetailsAsync(cvId, userId)
            );

            Assert.Equal($"CV not found. ID: {cvId}", exception.Message);
            _mockCvRepo.Verify(r => r.BelongsToUserAsync(cvId, userId), Times.Once);
            _mockCvRepo.Verify(r => r.GetByIdAsync(cvId), Times.Once);
        }
    }
}
