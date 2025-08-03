using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebAPI.Services;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    public class UserProfileServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly Mock<ILogger<UserProfileService>> _mockLogger;
        private readonly UserProfileService _service;

        public UserProfileServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Setup AutoMapper
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<UserProfileMappingProfile>();
            });
            _mapper = config.CreateMapper();

            _mockLogger = new Mock<ILogger<UserProfileService>>();

            _service = new UserProfileService(_context, _mapper, _mockLogger.Object);
        }

        [Fact]
        public async Task GetUserProfileAsync_ExistingProfile_ReturnsDto()
        {
            // Arrange
            var userId = "test-user-123";
            var profile = new UserProfile
            {
                UserId = userId,
                FirstName = "John",
                LastName = "Doe",
                Country = "Poland",
                Skills = new List<string> { "C#", "JavaScript" },
                PersonalityType = PersonalityType.Architect,
            };

            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserProfileAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().Be("John");
            result.LastName.Should().Be("Doe");
            result.Country.Should().Be("Poland");
            result.Skills.Should().ContainInOrder("C#", "JavaScript");
            result.PersonalityType.Should().Be(PersonalityType.Architect);
        }

        [Fact]
        public async Task GetUserProfileAsync_NonExistentProfile_ThrowsKeyNotFoundException()
        {
            // Arrange
            var userId = "non-existent-user";

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetUserProfileAsync(userId)
            );
        }

        [Fact]
        public async Task CreateUserProfileAsync_NewProfile_CreatesSuccessfully()
        {
            // Arrange
            var userId = "new-user-123";
            var profileDto = new UserProfileDto
            {
                FirstName = "Jane",
                LastName = "Smith",
                Country = "USA",
                Skills = new List<string> { "Python", "SQL" },
                PersonalityType = PersonalityType.Mediator,
                FinancialSurvey = new FinancialSurveyDto
                {
                    CurrentSalary = 5000,
                    DesiredSalary = 7000,
                    HasLoans = false,
                    RiskAppetite = Risk.Medium,
                    WillingToRelocate = true,
                },
            };

            // Act
            var result = await _service.CreateUserProfileAsync(userId, profileDto);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().Be("Jane");

            // Verify in database
            var savedProfile = await _context
                .UserProfiles.Include(p => p.FinancialSurvey)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            savedProfile.Should().NotBeNull();
            savedProfile!.FinancialSurvey.Should().NotBeNull();
            savedProfile.FinancialSurvey!.CurrentSalary.Should().Be(5000);
        }

        [Fact]
        public async Task UpdateUserProfileAsync_ExistingProfile_UpdatesSuccessfully()
        {
            // Arrange
            var userId = "update-test-user";
            var existingProfile = new UserProfile
            {
                UserId = userId,
                FirstName = "Old",
                LastName = "Name",
                Country = "Poland",
                Education = new List<EducationEntry>
                {
                    new EducationEntry
                    {
                        Institution = "Old University",
                        Degree = "Bachelor",
                        Field = "CS",
                    },
                },
            };

            _context.UserProfiles.Add(existingProfile);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear(); // Ważne dla testów

            var updateDto = new UserProfileDto
            {
                FirstName = "New",
                LastName = "Name",
                Country = "Germany",
                PersonalityType = PersonalityType.Commander,
                Education = new List<EducationEntryDto>
                {
                    new EducationEntryDto
                    {
                        Institution = "New University",
                        Degree = "Master",
                        Field = "AI",
                        StartDate = "2020-09-01",
                        EndDate = "2022-06-30",
                    },
                },
            };

            // Act
            var result = await _service.UpdateUserProfileAsync(userId, updateDto);

            // Assert
            result.FirstName.Should().Be("New");
            result.LastName.Should().Be("Name");
            result.Country.Should().Be("Germany");
            result.Education.Should().HaveCount(1);
            result.Education![0].Institution.Should().Be("New University");
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
