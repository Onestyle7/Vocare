using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.Repositories;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    public class CvGenerationServiceTests
    {
        private readonly Mock<IUserProfileRepository> _mockUserProfileRepo;
        private readonly Mock<ILogger<CvGenerationService>> _mockLogger;
        private readonly CvGenerationService _service;

        public CvGenerationServiceTests()
        {
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockLogger = new Mock<ILogger<CvGenerationService>>();

            _service = new CvGenerationService(_mockUserProfileRepo.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GenerateCvAsync_CompleteProfile_GeneratesFullCv()
        {
            // Arrange
            var userId = "test-user";
            var position = "Software Developer";

            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "John",
                LastName = "Doe",
                Country = "Poland",
                Address = "Warsaw",
                PhoneNumber = "+48123456789",
                User = new User { Email = "john.doe@example.com" },
                Skills = new List<string> { "C#", "JavaScript", "SQL" },
                WorkExperience = new List<WorkExperienceEntry>
                {
                    new WorkExperienceEntry
                    {
                        Company = "Tech Corp",
                        Position = "Junior Developer",
                        Description = "Developed web applications",
                        StartDate = new DateTime(2020, 1, 1),
                        EndDate = new DateTime(2022, 12, 31),
                        Responsibilities = new List<string> { "Coding", "Testing" },
                    },
                },
                Education = new List<EducationEntry>
                {
                    new EducationEntry
                    {
                        Institution = "Warsaw University",
                        Degree = "Master",
                        Field = "Computer Science",
                        StartDate = new DateTime(2015, 10, 1),
                        EndDate = new DateTime(2020, 6, 30),
                    },
                },
                Certificates = new List<CertificateEntry>
                {
                    new CertificateEntry
                    {
                        Name = "Azure Certified",
                        Date = new DateTime(2021, 5, 15),
                    },
                },
                Languages = new List<LanguageEntry>
                {
                    new LanguageEntry { Language = "Polish", Level = "Native" },
                    new LanguageEntry { Language = "English", Level = "C1" },
                },
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, position);

            // Assert
            result.Should().NotBeNull();

            // Basics
            result.Basics!.FirstName.Should().Be("John");
            result.Basics.LastName.Should().Be("Doe");
            result.Basics.Email.Should().Be("john.doe@example.com");
            result.Basics.PhoneNumber.Should().Be("+48123456789");
            result.Basics.Location.City.Should().Be("Warsaw");
            result.Basics.Location.Country.Should().Be("Poland");

            // Skills
            result.Skills.Should().ContainInOrder("C#", "JavaScript", "SQL");

            // Work Experience
            result.Work.Should().HaveCount(1);
            result.Work![0].Company.Should().Be("Tech Corp");
            result.Work[0].Position.Should().Be("Junior Developer");
            result.Work[0].StartDate.Should().Be("2020-01-01");
            result.Work[0].EndDate.Should().Be("2022-12-31");
            result.Work[0].Description.Should().Contain("Developed web applications");
            result.Work[0].Description.Should().Contain("Główne obowiązki: Coding, Testing");

            // Education
            result.Education.Should().HaveCount(1);
            result.Education![0].Institution.Should().Be("Warsaw University");
            result.Education[0].Degree.Should().Be("Master");
            result.Education[0].Field.Should().Be("Computer Science");

            // Certificates
            result.Certificates.Should().HaveCount(1);
            result.Certificates![0].Name.Should().Be("Azure Certified");
            result.Certificates[0].Date.Should().Be("2021-05-15");

            // Languages
            result.Languages.Should().HaveCount(2);
            result.Languages![0].Language.Should().Be("Polish");
            result.Languages[0].Fluency.Should().Be("Native");
        }

        [Fact]
        public async Task GenerateCvAsync_UserNotFound_ThrowsException()
        {
            // Arrange
            var userId = "non-existent";

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync((UserProfile)null!);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(
                () => _service.GenerateCvAsync(userId, null)
            );

            exception.Message.Should().Contain($"User profile not found for userId: {userId}");
        }

        [Fact]
        public async Task GenerateCvAsync_MinimalProfile_GeneratesBasicCv()
        {
            // Arrange
            var userId = "test-user";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Jane",
                LastName = "Smith",
                Country = "USA",
                // Wszystkie kolekcje są puste
                Skills = new List<string>(),
                WorkExperience = null,
                Education = null,
                Certificates = null,
                Languages = null,
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, null);

            // Assert
            result.Should().NotBeNull();
            result.Basics!.FirstName.Should().Be("Jane");
            result.Basics.LastName.Should().Be("Smith");
            result.Basics.Email.Should().Be("user-Jane@gmail.com"); // Default email
            result.Work.Should().BeEmpty();
            result.Education.Should().BeEmpty();
            result.Certificates.Should().BeEmpty();
            result.Skills.Should().BeEmpty();
            result.Languages.Should().BeEmpty();
        }
    }
}
