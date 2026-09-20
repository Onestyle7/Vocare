using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="UserProfileService"/> (dostawca InMemory + realny AutoMapper).
    /// </summary>
    public sealed class UserProfileServiceTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly Mock<IUserProfileRepository> _repository = new();
        private readonly UserProfileService _sut;

        public UserProfileServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new UserProfileService(
                _context,
                MapperFactory.Create(typeof(UserProfileMappingProfile)),
                NullLogger<UserProfileService>.Instance,
                _repository.Object
            );
        }

        public void Dispose() => _context.Dispose();

        private async Task SeedProfileAsync(Action<UserProfile>? configure = null)
        {
            var profile = new UserProfile
            {
                UserId = UserId,
                FirstName = "Ada",
                LastName = "Byron",
                Country = "Poland",
            };
            configure?.Invoke(profile);
            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        // ---------- GetUserProfileAsync ----------

        [Fact]
        public async Task GetUserProfileAsync_BackfillsWorkResponsibilitiesFromDescription()
        {
            _repository
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(
                    new UserProfile
                    {
                        UserId = UserId,
                        FirstName = "Ada",
                        WorkExperience = new List<WorkExperienceEntry>
                        {
                            new()
                            {
                                Company = "Acme",
                                Position = "Dev",
                                Description = "Built the billing system",
                                Responsibilities = null,
                            },
                        },
                    }
                );

            var dto = await _sut.GetUserProfileAsync(UserId);

            dto.WorkExperience.Should().ContainSingle();
            dto.WorkExperience![0]
                .Responsibilities.Should()
                .ContainSingle()
                .Which.Should()
                .Be("Built the billing system");
        }

        // ---------- UpdateUserProfileAsync ----------

        [Fact]
        public async Task UpdateUserProfileAsync_WhenProfileMissing_Throws()
        {
            await _sut.Invoking(s => s.UpdateUserProfileAsync(UserId, new UserProfileDto()))
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task UpdateUserProfileAsync_PersistsBasicFieldsAndReplacesCollections()
        {
            await SeedProfileAsync(p =>
                p.Education.Add(new EducationEntry { Institution = "Old school" })
            );

            var dto = new UserProfileDto
            {
                FirstName = "Grace",
                LastName = "Hopper",
                Country = "USA",
                Skills = new List<string> { "COBOL" },
                Education = new List<EducationEntryDto>
                {
                    new()
                    {
                        Institution = "Yale",
                        Degree = "PhD",
                        Field = "Math",
                    },
                },
            };

            var result = await _sut.UpdateUserProfileAsync(UserId, dto);

            result.FirstName.Should().Be("Grace");
            _context.ChangeTracker.Clear();
            var reloaded = await _context.UserProfiles.Include(p => p.Education).SingleAsync();
            reloaded.FirstName.Should().Be("Grace");
            reloaded.Education.Should().ContainSingle().Which.Institution.Should().Be("Yale");
        }

        // ---------- DeleteUserProfileAsync ----------

        [Fact]
        public async Task DeleteUserProfileAsync_WhenMissing_Throws()
        {
            await _sut.Invoking(s => s.DeleteUserProfileAsync(UserId))
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task DeleteUserProfileAsync_RemovesProfile()
        {
            await SeedProfileAsync();

            await _sut.DeleteUserProfileAsync(UserId);

            _context.ChangeTracker.Clear();
            (await _context.UserProfiles.AnyAsync()).Should().BeFalse();
        }

        // ---------- ClearUserProfileAsync ----------

        [Fact]
        public async Task ClearUserProfileAsync_ResetsScalarFieldsAndCollections()
        {
            var tracked = new UserProfile
            {
                UserId = UserId,
                FirstName = "Ada",
                LastName = "Byron",
                Country = "Poland",
                Address = "Warsaw",
                WillingToRebrand = true,
                PersonalityType = PersonalityType.Architect,
                Skills = new List<string> { "C#" },
                Education = new List<EducationEntry> { new() { Institution = "MIT" } },
                FinancialSurvey = new FinancialSurvey
                {
                    UserId = UserId,
                    CurrentSalary = 5000,
                    HasLoans = true,
                },
            };
            _repository
                .Setup(r => r.GetTrackedProfileWithCollectionsAsync(UserId))
                .ReturnsAsync(tracked);
            _repository.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await _sut.ClearUserProfileAsync(UserId);

            tracked.FirstName.Should().BeEmpty();
            tracked.Address.Should().BeNull();
            tracked.WillingToRebrand.Should().BeFalse();
            tracked.PersonalityType.Should().Be(PersonalityType.Unknown);
            tracked.Skills.Should().BeEmpty();
            tracked.Education.Should().BeEmpty();
            tracked.FinancialSurvey!.CurrentSalary.Should().BeNull();
            tracked.FinancialSurvey.HasLoans.Should().BeFalse();
            _repository.Verify(r => r.SaveChangesAsync(), Times.Once);
        }
    }
}
