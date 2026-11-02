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
            entity.Category.Should().Be("backend");
        }

        [Theory]
        [InlineData(0, 0, null, null)]
        [InlineData(0, 5000, null, 5000)]
        [InlineData(null, 5000, null, 5000)]
        [InlineData(4000, 5000, 4000, 5000)]
        public void ToJobOfferEntity_TreatsZeroSalaryAsMissing(
            int? from,
            int? to,
            int? expectedMin,
            int? expectedMax
        )
        {
            var source = SourceOffer() with
            {
                Salary = SourceOffer().Salary with { From = (decimal?)from, To = (decimal?)to },
            };

            var entity = source.ToJobOfferEntity();

            entity.SalaryMin.Should().Be((decimal?)expectedMin);
            entity.SalaryMax.Should().Be((decimal?)expectedMax);
        }

        [Theory]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.DotNet, "backend")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.NodeJs, "backend")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.React, "frontend")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.JavaScript, "frontend")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.IOS, "mobile")]
        [InlineData(Sj.JobCategory.Tester, Sj.JobSubCategory.ManualTester, "testing")]
        [InlineData(Sj.JobCategory.ItManager, Sj.JobSubCategory.ProjectManager, "projectManager")]
        [InlineData(Sj.JobCategory.ItManager, Sj.JobSubCategory.ProductOwner, "productManagement")]
        [InlineData(Sj.JobCategory.ItManager, Sj.JobSubCategory.ScrumMaster, "agile")]
        [InlineData(Sj.JobCategory.Analyst, Sj.JobSubCategory.Analyst, "businessAnalyst")]
        [InlineData(
            Sj.JobCategory.Administrator,
            Sj.JobSubCategory.CloudAdministrator,
            "sysAdministrator"
        )]
        [InlineData(Sj.JobCategory.UXUIDesigner, Sj.JobSubCategory.UXUIDesigner, "ux")]
        [InlineData(Sj.JobCategory.OtherIT, Sj.JobSubCategory.ERP, "erp")]
        [InlineData(Sj.JobCategory.OtherIT, Sj.JobSubCategory.OtherIT, "other")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.CCPlusPlus, "embedded")]
        [InlineData(Sj.JobCategory.Developer, Sj.JobSubCategory.OtherDeveloper, "backend")]
        [InlineData(
            Sj.JobCategory.AutomationAndRobotics,
            Sj.JobSubCategory.AutomationAndRobotics,
            "automation"
        )]
        [InlineData(
            Sj.JobCategory.MaintenanceEngineering,
            Sj.JobSubCategory.MaintenanceEngineering,
            "mechanics"
        )]
        [InlineData(
            Sj.JobCategory.QualityEngineering,
            Sj.JobSubCategory.QualityEngineering,
            "testing"
        )]
        [InlineData(Sj.JobCategory.Marketing, Sj.JobSubCategory.Marketing, "marketing")]
        [InlineData(Sj.JobCategory.SEO, Sj.JobSubCategory.SEO, "marketing")]
        [InlineData(Sj.JobCategory.B2BSales, Sj.JobSubCategory.B2BSales, "sales")]
        [InlineData(Sj.JobCategory.ECommerce, Sj.JobSubCategory.ECommerce, "sales")]
        [InlineData(
            Sj.JobCategory.CustomerSuccess,
            Sj.JobSubCategory.CustomerSuccess,
            "customerService"
        )]
        [InlineData(Sj.JobCategory.Recruiter, Sj.JobSubCategory.Recruiter, "hr")]
        [InlineData(Sj.JobCategory.SupplyChain, Sj.JobSubCategory.SupplyChain, "logistics")]
        [InlineData(Sj.JobCategory.Accounting, Sj.JobSubCategory.Accounting, "finance")]
        [InlineData(
            Sj.JobCategory.LawAndAdministration,
            Sj.JobSubCategory.LawAndAdministration,
            "law"
        )]
        [InlineData(
            Sj.JobCategory.OtherOther,
            Sj.JobSubCategory.Backoffice,
            "officeAdministration"
        )]
        [InlineData(Sj.JobCategory.OtherOther, Sj.JobSubCategory.GraphicDesigner, "marketing")]
        [InlineData(Sj.JobCategory.Management, Sj.JobSubCategory.Management, "other")]
        public void MapCategory_MapsToNoFluffJobsVocabulary(
            Sj.JobCategory category,
            Sj.JobSubCategory subCategory,
            string expected
        )
        {
            SolidJobsMappingExtensions.MapCategory(category, subCategory).Should().Be(expected);
        }

        /// <summary>
        /// Słownik kategorii, z którego AI wybiera AllowedJobCategories (prompt w OpenAIService).
        /// Kategoria spoza słownika nigdy nie przejdzie filtra kategorii w matchingu.
        /// </summary>
        private static readonly HashSet<string> AiCategoryVocabulary = new()
        {
            "agile",
            "architecture",
            "artificialIntelligence",
            "automation",
            "backend",
            "businessAnalyst",
            "businessIntelligence",
            "consulting",
            "customerService",
            "data",
            "devops",
            "electricalEng",
            "electronics",
            "embedded",
            "erp",
            "finance",
            "frontend",
            "fullstack",
            "gameDev",
            "hr",
            "law",
            "logistics",
            "marketing",
            "mechanics",
            "mobile",
            "officeAdministration",
            "other",
            "productManagement",
            "projectManager",
            "sales",
            "security",
            "support",
            "sysAdministrator",
            "telecommunication",
            "testing",
            "ux",
        };

        [Fact]
        public void MapCategory_AlwaysReturnsCategoryFromAiVocabulary()
        {
            var results =
                from category in Enum.GetValues<Sj.JobCategory>()
                from subCategory in Enum.GetValues<Sj.JobSubCategory>()
                select SolidJobsMappingExtensions.MapCategory(category, subCategory);

            results.Distinct().Should().OnlyContain(c => AiCategoryVocabulary.Contains(c));
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
