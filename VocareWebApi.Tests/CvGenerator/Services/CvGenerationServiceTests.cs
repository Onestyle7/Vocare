using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Entities;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="CvGenerationService"/> – mapowanie profilu użytkownika na
    /// strukturę CV.
    /// </summary>
    public sealed class CvGenerationServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IUserProfileRepository> _profiles = new();
        private readonly CvGenerationService _sut;

        public CvGenerationServiceTests()
        {
            _sut = new CvGenerationService(
                _profiles.Object,
                NullLogger<CvGenerationService>.Instance
            );
        }

        [Fact]
        public async Task GenerateCvAsync_WhenProfileMissing_ThrowsUserProfileNotFound()
        {
            _profiles
                .Setup(p => p.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync((UserProfile)null!);

            await _sut.Invoking(s => s.GenerateCvAsync(UserId, null))
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task GenerateCvAsync_MapsProfileFieldsIntoCv()
        {
            var profile = new UserProfile
            {
                UserId = UserId,
                FirstName = "Ada",
                LastName = "Byron",
                Country = "Poland",
                Address = "Warsaw",
                AboutMe = "Backend engineer",
                Skills = new List<string> { "C#", "SQL" },
                WorkExperience = new List<WorkExperienceEntry>
                {
                    new()
                    {
                        Company = "Acme",
                        Position = "Developer",
                        StartDate = new DateTime(2022, 1, 1),
                        EndDate = null,
                        Description = "Built APIs",
                    },
                },
                Education = new List<EducationEntry>
                {
                    new()
                    {
                        Institution = "MIT",
                        Degree = "BSc",
                        Field = "CS",
                        StartDate = new DateTime(2018, 10, 1),
                        EndDate = new DateTime(2021, 6, 1),
                    },
                },
                Languages = new List<LanguageEntry>
                {
                    new() { Language = "English", Level = "C1" },
                },
            };
            _profiles.Setup(p => p.GetUserProfileByIdAsync(UserId)).ReturnsAsync(profile);

            var cv = await _sut.GenerateCvAsync(UserId, "Backend Developer");

            cv.Basics.FirstName.Should().Be("Ada");
            cv.Basics.Location.City.Should().Be("Warsaw");
            cv.Basics.Summary.Should().Be("Backend engineer");
            cv.Skills.Should().BeEquivalentTo(new[] { "C#", "SQL" });
            cv.Work.Should().ContainSingle();
            cv.Work[0].EndDate.Should().Be("Present");
            cv.Work[0].Responsibilities.Should().ContainSingle().Which.Should().Be("Built APIs");
            cv.Education.Should().ContainSingle();
            cv.Education[0].EndDate.Should().Be("2021-06-01");
            cv.Languages.Should().ContainSingle().Which.Fluency.Should().Be("C1");
        }
    }
}
