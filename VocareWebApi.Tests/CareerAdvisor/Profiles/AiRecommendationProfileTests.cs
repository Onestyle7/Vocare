using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Profiles
{
    /// <summary>Testy mapowań AutoMappera dla rekomendacji AI (<see cref="AiRecommendationProfile"/>).</summary>
    public sealed class AiRecommendationProfileTests
    {
        private readonly IMapper _mapper = MapperFactory.Create(typeof(AiRecommendationProfile));

        [Fact]
        public void Map_ResponseDtoToEntity_FlattensRecommendationSection()
        {
            var dto = new AiCareerResponseDto
            {
                Recommendation = new FinalRecommendationDto
                {
                    PrimaryPath = "Backend Developer",
                    Justification = "Strong fundamentals",
                    LongTermGoal = "Tech Lead",
                    NextSteps = new List<string> { "Learn SQL", "Build a portfolio" },
                },
                CareerPaths = new List<CareerPathDto>
                {
                    new()
                    {
                        CareerName = "Backend Developer",
                        Description = "Builds APIs",
                        RequiredSkills = new List<string> { "C#", "SQL" },
                        SwotAnalysis = new SwotAnalysisDto
                        {
                            Strengths = new List<string> { "Analytical" },
                        },
                    },
                },
            };

            var entity = _mapper.Map<AiRecommendation>(dto);

            entity.PrimaryPath.Should().Be("Backend Developer");
            entity.Justification.Should().Be("Strong fundamentals");
            entity.LongTermGoal.Should().Be("Tech Lead");
            entity.NextSteps.Should().HaveCount(2);
            entity.NextSteps.Should().Contain(ns => ns.Step == "Learn SQL");
            entity.CareerPaths.Should().ContainSingle();
            entity.CareerPaths[0].CareerName.Should().Be("Backend Developer");
            entity.CareerPaths[0].RequiredSkills.Should().BeEquivalentTo(new[] { "C#", "SQL" });
            entity.CareerPaths[0].SwotAnalysis.Strengths.Should().Contain("Analytical");
        }

        [Fact]
        public void Map_StringToNextStepAndBack_RoundTrips()
        {
            _mapper.Map<NextStep>("Apply to 3 roles").Step.Should().Be("Apply to 3 roles");
            _mapper
                .Map<string>(new NextStep { Step = "Apply to 3 roles" })
                .Should()
                .Be("Apply to 3 roles");
        }

        [Fact]
        public void Map_SwotDtoToEntity_CopiesAllQuadrants()
        {
            var dto = new SwotAnalysisDto
            {
                Strengths = new List<string> { "s" },
                Weaknesses = new List<string> { "w" },
                Opportunities = new List<string> { "o" },
                Threats = new List<string> { "t" },
            };

            var entity = _mapper.Map<SwotAnalysis>(dto);

            entity.Strengths.Should().ContainSingle().Which.Should().Be("s");
            entity.Weaknesses.Should().ContainSingle().Which.Should().Be("w");
            entity.Opportunities.Should().ContainSingle().Which.Should().Be("o");
            entity.Threats.Should().ContainSingle().Which.Should().Be("t");
        }
    }
}
