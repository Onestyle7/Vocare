using System.Collections.Generic;
using FluentAssertions;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Services.Prompts;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>Testy jednostkowe czystego buildera promptów <see cref="RoadmapPromptBuilder"/>.</summary>
    public sealed class RoadmapPromptBuilderTests
    {
        [Fact]
        public void BuildSystemPrompt_DescribesRequiredJsonContract()
        {
            var prompt = RoadmapPromptBuilder.BuildSystemPrompt();

            prompt.Should().Contain("WYMAGANY FORMAT JSON");
            prompt.Should().Contain("parentRef");
            prompt.Should().Contain("isAchievable");
        }

        [Fact]
        public void BuildUserPrompt_EmbedsRequestData()
        {
            var request = new RoadmapGenerationRequest
            {
                CareerPathName = "Backend Developer",
                SuggestedSeniority = "Junior",
                TimeHorizonMonths = 12,
                UserSkills = new List<string> { "HTML", "CSS" },
                RequiredSkills = new List<string> { "C#", "SQL" },
            };

            var prompt = RoadmapPromptBuilder.BuildUserPrompt(request);

            prompt.Should().Contain("Backend Developer");
            prompt.Should().Contain("Junior");
            prompt.Should().Contain("12 miesięcy");
            prompt.Should().Contain("HTML, CSS");
            prompt.Should().Contain("C#, SQL");
        }

        [Theory]
        [InlineData(3, "Maksymalna liczba faz: 2")]
        [InlineData(6, "Maksymalna liczba faz: 3")]
        [InlineData(12, "Maksymalna liczba faz: 4")]
        [InlineData(24, "Maksymalna liczba faz: 6")]
        public void BuildUserPrompt_AppliesHorizonSpecificRules(int months, string expectedFragment)
        {
            var request = new RoadmapGenerationRequest
            {
                CareerPathName = "Role",
                SuggestedSeniority = "Junior",
                TimeHorizonMonths = months,
                UserSkills = new List<string>(),
                RequiredSkills = new List<string>(),
            };

            RoadmapPromptBuilder.BuildUserPrompt(request).Should().Contain(expectedFragment);
        }

        [Fact]
        public void BuildUserPrompt_WithoutSkills_UsesFallbackText()
        {
            var request = new RoadmapGenerationRequest
            {
                CareerPathName = "Role",
                SuggestedSeniority = "Junior",
                TimeHorizonMonths = 6,
                UserSkills = new List<string>(),
                RequiredSkills = new List<string>(),
            };

            var prompt = RoadmapPromptBuilder.BuildUserPrompt(request);

            prompt.Should().Contain("Brak zadeklarowanych umiejętności");
            prompt.Should().Contain("Brak określonych wymagań");
        }
    }
}
