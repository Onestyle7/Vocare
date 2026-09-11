using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Profiles
{
    /// <summary>Testy mapowań <see cref="UserProfileMappingProfile"/> – parsowanie dat i pole Email.</summary>
    public sealed class UserProfileMappingProfileTests
    {
        private readonly IMapper _mapper = MapperFactory.Create(typeof(UserProfileMappingProfile));

        [Fact]
        public void Map_EducationDto_ParsesIsoDatesAsUtc()
        {
            var entity = _mapper.Map<EducationEntry>(
                new EducationEntryDto
                {
                    Institution = "MIT",
                    StartDate = "2018-10-01",
                    EndDate = "2021-06-30",
                }
            );

            entity
                .StartDate.Should()
                .Be(new System.DateTime(2018, 10, 1, 0, 0, 0, System.DateTimeKind.Utc));
            entity.StartDate!.Value.Kind.Should().Be(System.DateTimeKind.Utc);
            entity
                .EndDate.Should()
                .Be(new System.DateTime(2021, 6, 30, 0, 0, 0, System.DateTimeKind.Utc));
        }

        [Fact]
        public void Map_EducationDto_WithEmptyDates_ProducesNull()
        {
            var entity = _mapper.Map<EducationEntry>(new EducationEntryDto { Institution = "MIT" });

            entity.StartDate.Should().BeNull();
            entity.EndDate.Should().BeNull();
        }

        [Fact]
        public void Map_WorkExperienceDto_TreatsPresentEndDateAsNull()
        {
            var entity = _mapper.Map<WorkExperienceEntry>(
                new WorkExperienceEntryDto
                {
                    Company = "Acme",
                    Position = "Dev",
                    StartDate = "2022-01-01",
                    EndDate = "Present",
                }
            );

            entity.StartDate.Should().NotBeNull();
            entity.EndDate.Should().BeNull();
        }

        [Fact]
        public void Map_WorkExperienceDto_NullDescriptionBecomesEmptyString()
        {
            var entity = _mapper.Map<WorkExperienceEntry>(
                new WorkExperienceEntryDto
                {
                    Company = "Acme",
                    Position = "Dev",
                    Description = null!,
                }
            );

            entity.Description.Should().BeEmpty();
        }

        [Fact]
        public void Map_UserProfileToDto_TakesEmailFromLinkedUser()
        {
            var profile = new UserProfile
            {
                UserId = "user-123",
                FirstName = "Ada",
                User = new User { Email = "ada@example.com" },
            };

            var dto = _mapper.Map<UserProfileDto>(profile);

            dto.Email.Should().Be("ada@example.com");
        }
    }
}
