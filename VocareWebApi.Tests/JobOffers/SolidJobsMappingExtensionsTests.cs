using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Enums;
using Xunit;
using Sj = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="SolidJobsMappingExtensions.ToJobOfferEntity"/> – mapowanie
    /// modelu SolidJobs na wewnętrzną encję <c>JobOffer</c>.
    /// </summary>
    public sealed class SolidJobsMappingExtensionsTests
    {
        private static Sj.JobOffer SourceOffer(
            Sj.ExperienceLevel experience = Sj.ExperienceLevel.Regular,
            Sj.SkillLevel skillLevel = Sj.SkillLevel.Advanced,
            bool isRemote = true
        ) =>
            new()
            {
                JobOfferKey = "SJ-1",
                Title = "Backend Developer",
                Division = Sj.Division.IT,
                Category = Sj.JobCategory.Developer,
                SubCategory = Sj.JobSubCategory.DotNet,
                Company = "Acme",
                Salary = new Sj.Salary
                {
                    From = 18000,
                    To = 25000,
                    Currency = "PLN",
                    Period = "Month",
                    EmploymentType = "B2B",
                },
                ContractTime = "fulltime",
                Locations = new List<string> { "Warszawa" },
                Benefits = new List<string>(),
                IsRemote = isRemote,
                IsHybrid = false,
                Url = "https://solid.jobs/1",
                ExperienceLevel = experience,
                Skills = new List<Sj.SkillTag>
                {
                    new() { Name = "C#", Level = skillLevel },
                },
                Languages = new List<Sj.SkillTag>(),
                Description = "Build APIs",
                ValidFrom = new DateTimeOffset(2025, 2, 1, 0, 0, 0, TimeSpan.Zero),
                ValidTo = new DateTimeOffset(2025, 3, 1, 0, 0, 0, TimeSpan.Zero),
            };

        [Fact]
        public void ToJobOfferEntity_MapsCoreFields()
        {
            var entity = SourceOffer().ToJobOfferEntity();

            entity.ReferenceNumber.Should().Be("SJ-1");
            entity.Title.Should().Be("Backend Developer");
            entity.CompanyName.Should().Be("Acme");
            entity.Country.Should().Be("Poland");
            entity.Source.Should().Be(JobOfferSource.SolidJobs);
            entity.SalaryMin.Should().Be(18000);
            entity.SalaryPeriod.Should().Be(SalaryPeriod.Month);
        }

        [Theory]
        [InlineData(Sj.ExperienceLevel.None, SeniorityLevel.Unknown)]
        [InlineData(Sj.ExperienceLevel.Intern, SeniorityLevel.Trainee)]
        [InlineData(Sj.ExperienceLevel.Junior, SeniorityLevel.Junior)]
        [InlineData(Sj.ExperienceLevel.Regular, SeniorityLevel.Mid)]
        [InlineData(Sj.ExperienceLevel.Senior, SeniorityLevel.Senior)]
        public void ToJobOfferEntity_MapsExperienceLevelToSeniority(
            Sj.ExperienceLevel source,
            SeniorityLevel expected
        )
        {
            SourceOffer(experience: source).ToJobOfferEntity().SeniorityLevel.Should().Be(expected);
        }

        [Theory]
        [InlineData(Sj.SkillLevel.NiceToHave, SkillLevel.NiceToHave)]
        [InlineData(Sj.SkillLevel.Basic, SkillLevel.Regular)]
        [InlineData(Sj.SkillLevel.Advanced, SkillLevel.Advanced)]
        [InlineData(Sj.SkillLevel.Expert, SkillLevel.Expert)]
        public void ToJobOfferEntity_MapsSkillLevels(Sj.SkillLevel source, SkillLevel expected)
        {
            var skill = SourceOffer(skillLevel: source).ToJobOfferEntity().Skills.Single();

            skill.Name.Should().Be("C#");
            skill.Level.Should().Be(expected);
        }

        [Fact]
        public void ToJobOfferEntity_PropagatesRemoteFlagToLocations()
        {
            var entity = SourceOffer(isRemote: true).ToJobOfferEntity();

            entity.Locations.Should().ContainSingle().Which.IsRemote.Should().BeTrue();
        }
    }
}
