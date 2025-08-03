using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Models.Entities;
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
            // Arrange - inicjalizacja mocków
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockLogger = new Mock<ILogger<CvGenerationService>>();

            // Tworzenie instancji serwisu
            _service = new CvGenerationService(_mockUserProfileRepo.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GenerateCvAsync_CompleteProfile_GeneratesFullCv()
        {
            // Arrange - przygotowanie kompletnego profilu użytkownika
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
                        Issuer = "Microsoft",
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

            // Assert - weryfikacja podstawowych danych
            result.Should().NotBeNull();

            // Weryfikacja sekcji Basics
            result.Basics.Should().NotBeNull();
            result.Basics!.FirstName.Should().Be("John");
            result.Basics.LastName.Should().Be("Doe");
            result.Basics.Email.Should().Be("john.doe@example.com");
            result.Basics.PhoneNumber.Should().Be("+48123456789");
            result.Basics.Location.Should().NotBeNull();
            result.Basics.Location.City.Should().Be("Warsaw");
            result.Basics.Location.Country.Should().Be("Poland");

            // Weryfikacja umiejętności
            result.Skills.Should().NotBeNull();
            result.Skills!.Should().HaveCount(3);
            result.Skills.Should().ContainInOrder("C#", "JavaScript", "SQL");

            // Weryfikacja doświadczenia zawodowego
            result.Work.Should().NotBeNull();
            result.Work!.Should().HaveCount(1);
            var work = result.Work[0];
            work.Company.Should().Be("Tech Corp");
            work.Position.Should().Be("Junior Developer");
            work.StartDate.Should().Be("2020-01-01");
            work.EndDate.Should().Be("2022-12-31");
            work.Description.Should().Contain("Developed web applications");
            work.Description.Should().Contain("Główne obowiązki: Coding, Testing");

            // Weryfikacja edukacji
            result.Education.Should().NotBeNull();
            result.Education!.Should().HaveCount(1);
            var education = result.Education[0];
            education.Institution.Should().Be("Warsaw University");
            education.Degree.Should().Be("Master");
            education.Field.Should().Be("Computer Science");
            education.StartDate.Should().Be("2015-10-01");
            education.EndDate.Should().Be("2020-06-30");

            // Weryfikacja certyfikatów
            result.Certificates.Should().NotBeNull();
            result.Certificates!.Should().HaveCount(1);
            var certificate = result.Certificates[0];
            certificate.Name.Should().Be("Azure Certified");
            certificate.Date.Should().Be("2021-05-15");

            // Weryfikacja języków
            result.Languages.Should().NotBeNull();
            result.Languages!.Should().HaveCount(2);
            result.Languages[0].Language.Should().Be("Polish");
            result.Languages[0].Fluency.Should().Be("Native");
            result.Languages[1].Language.Should().Be("English");
            result.Languages[1].Fluency.Should().Be("C1");

            // Weryfikacja, że repozytorium zostało wywołane
            _mockUserProfileRepo.Verify(x => x.GetUserProfileByIdAsync(userId), Times.Once);
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
            var action = async () => await _service.GenerateCvAsync(userId, null);

            await action
                .Should()
                .ThrowAsync<Exception>()
                .WithMessage($"User profile not found for userId: {userId}");
        }

        [Fact]
        public async Task GenerateCvAsync_MinimalProfile_GeneratesBasicCv()
        {
            // Arrange - minimalny profil bez dodatkowych informacji
            var userId = "test-user";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Jane",
                LastName = "Smith",
                Country = "USA",
                // Wszystkie kolekcje są puste lub null
                Skills = new List<string>(),
                WorkExperience = null,
                Education = null,
                Certificates = null,
                Languages = null,
                PhoneNumber = null,
                Address = null,
                User = null,
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, null);

            // Assert
            result.Should().NotBeNull();

            // Podstawowe dane
            result.Basics!.FirstName.Should().Be("Jane");
            result.Basics.LastName.Should().Be("Smith");
            result.Basics.Email.Should().Be("user-Jane@gmail.com"); // Domyślny email
            result.Basics.PhoneNumber.Should().BeEmpty();
            result.Basics.Location.City.Should().BeEmpty();
            result.Basics.Location.Country.Should().Be("USA");

            // Puste kolekcje
            result.Work.Should().NotBeNull().And.BeEmpty();
            result.Education.Should().NotBeNull().And.BeEmpty();
            result.Certificates.Should().NotBeNull().And.BeEmpty();
            result.Skills.Should().NotBeNull().And.BeEmpty();
            result.Languages.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public async Task GenerateCvAsync_WithCurrentWorkExperience_ShowsPresentAsEndDate()
        {
            // Arrange
            var userId = "test-user";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Test",
                LastName = "User",
                Country = "Poland",
                WorkExperience = new List<WorkExperienceEntry>
                {
                    new WorkExperienceEntry
                    {
                        Company = "Current Company",
                        Position = "Senior Developer",
                        Description = "Working on projects",
                        StartDate = new DateTime(2023, 1, 1),
                        EndDate = null, // Brak daty końca = obecnie pracuje
                    },
                },
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, null);

            // Assert
            result.Work.Should().HaveCount(1);
            result.Work![0].EndDate.Should().Be("Present");
        }

        [Fact]
        public async Task GenerateCvAsync_WorkExperienceWithoutDescription_GeneratesDefaultDescription()
        {
            // Arrange
            var userId = "test-user";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Test",
                LastName = "User",
                Country = "Poland",
                WorkExperience = new List<WorkExperienceEntry>
                {
                    new WorkExperienceEntry
                    {
                        Company = "Some Company",
                        Position = "Developer",
                        Description = "", // Pusty opis
                        StartDate = new DateTime(2020, 1, 1),
                        EndDate = new DateTime(2021, 12, 31),
                        Responsibilities = null, // Brak responsibilities
                    },
                },
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, null);

            // Assert
            result.Work.Should().HaveCount(1);
            result
                .Work![0]
                .Description.Should()
                .Be("Praca na stanowisku Developer w firmie Some Company.");
        }

        [Fact]
        public async Task GenerateCvAsync_WithUserEmail_UsesActualEmail()
        {
            // Arrange
            var userId = "test-user";
            var expectedEmail = "actual.user@company.com";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Real",
                LastName = "User",
                Country = "Poland",
                User = new User
                {
                    Email = expectedEmail,
                    Id = userId,
                    UserName = expectedEmail,
                },
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            var result = await _service.GenerateCvAsync(userId, null);

            // Assert
            result.Basics!.Email.Should().Be(expectedEmail);
        }

        [Fact]
        public async Task GenerateCvAsync_LogsProcessingSteps()
        {
            // Arrange
            var userId = "test-user";
            var userProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Log",
                LastName = "Test",
                Country = "Poland",
                Skills = new List<string> { "Testing" },
                WorkExperience = new List<WorkExperienceEntry>(),
                Education = new List<EducationEntry>(),
                Certificates = new List<CertificateEntry>(),
                Languages = new List<LanguageEntry>(),
            };

            _mockUserProfileRepo
                .Setup(x => x.GetUserProfileByIdAsync(userId))
                .ReturnsAsync(userProfile);

            // Act
            await _service.GenerateCvAsync(userId, null);

            // Assert - weryfikacja logów
            _mockLogger.Verify(
                x =>
                    x.Log(
                        LogLevel.Information,
                        It.IsAny<EventId>(),
                        It.Is<It.IsAnyType>(
                            (o, t) => o.ToString()!.Contains("Starting CV generation")
                        ),
                        It.IsAny<Exception>(),
                        It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                    ),
                Times.Once
            );

            _mockLogger.Verify(
                x =>
                    x.Log(
                        LogLevel.Information,
                        It.IsAny<EventId>(),
                        It.Is<It.IsAnyType>(
                            (o, t) => o.ToString()!.Contains("Mapping CV for user")
                        ),
                        It.IsAny<Exception>(),
                        It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                    ),
                Times.Once
            );

            _mockLogger.Verify(
                x =>
                    x.Log(
                        LogLevel.Information,
                        It.IsAny<EventId>(),
                        It.Is<It.IsAnyType>(
                            (o, t) => o.ToString()!.Contains("Cv generation completed successfully")
                        ),
                        It.IsAny<Exception>(),
                        It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                    ),
                Times.Once
            );
        }
    }
}
