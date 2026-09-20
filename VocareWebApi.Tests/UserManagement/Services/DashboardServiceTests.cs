using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="DashboardService"/> – agregacja danych pulpitu oraz
    /// generowanie/odczyt atrybutów profilu.
    /// </summary>
    public sealed class DashboardServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IDashboardRepository> _dashboard = new();
        private readonly Mock<IUserProfileRepository> _profiles = new();
        private readonly Mock<IProfileAttributesRepository> _attributes = new();

        private DashboardService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                _dashboard.Object,
                _profiles.Object,
                _attributes.Object,
                new HttpClient(handler),
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" })
            );

        // ---------- GetDashboardSummaryAsync ----------

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetDashboardSummaryAsync_WithBlankUserId_Throws(string? userId)
        {
            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GetDashboardSummaryAsync(userId!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task GetDashboardSummaryAsync_AggregatesCountsCompletionAndSalaryProgress()
        {
            _dashboard.Setup(r => r.GetRecommendationsCountAsync(UserId)).ReturnsAsync(2);
            _dashboard.Setup(r => r.GetAnalysesCountAsync(UserId)).ReturnsAsync(5);
            _dashboard.Setup(r => r.GetRoadmapsCountAsync(UserId)).ReturnsAsync(1);
            _dashboard.Setup(r => r.GetCvsCountAsync(UserId)).ReturnsAsync(3);
            _dashboard
                .Setup(r => r.GetFinancialSurveyAsync(UserId))
                .ReturnsAsync(
                    new FinancialSurvey
                    {
                        UserId = UserId,
                        CurrentSalary = 5000,
                        DesiredSalary = 10000,
                    }
                );
            _profiles
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(
                    new UserProfile
                    {
                        UserId = UserId,
                        FirstName = "Ada",
                        LastName = "Byron",
                        Country = "Poland",
                    }
                );

            var summary = await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .GetDashboardSummaryAsync(UserId);

            summary.RecommendationsCount.Should().Be(2);
            summary.AnalysisCount.Should().Be(5);
            summary.CvsCount.Should().Be(3);
            summary.ProfileCompletionPercentage.Should().Be(20); // 3 of 15 fields
            summary.salaryProgressDto.GoalCompletionPercentage.Should().Be(50);
        }

        // ---------- GetProfileAttributesAsync ----------

        [Fact]
        public async Task GetProfileAttributesAsync_WhenStoredAttributesExist_ReturnsThemWithoutCallingAi()
        {
            _profiles
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(new UserProfile { UserId = UserId });
            _attributes
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new ProfileAttributes
                    {
                        UserId = UserId,
                        Creativity = 77,
                        TechnicalSkills = 88,
                    }
                );
            var handler = FakeHttpMessageHandler.Throwing(new InvalidOperationException("no AI"));

            var result = await CreateSut(handler).GetProfileAttributesAsync(UserId);

            result.Creativity.Should().Be(77);
            result.TechnicalSkills.Should().Be(88);
            handler.CallCount.Should().Be(0);
        }

        [Fact]
        public async Task GetProfileAttributesAsync_WhenNoStoredAttributes_GeneratesViaAiAndPersists()
        {
            _profiles
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(new UserProfile { UserId = UserId, FirstName = "Ada" });
            _attributes
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync((ProfileAttributes?)null);
            _attributes
                .Setup(r => r.SaveAsync(It.IsAny<ProfileAttributes>()))
                .Returns(Task.CompletedTask);

            var attributesJson = JsonSerializer.Serialize(
                new
                {
                    practicalExperience = 30,
                    hardCompetencies = 40,
                    creativity = 50,
                    teamwork = 60,
                    independence = 70,
                    softCompetencies = 45,
                    certification = 20,
                    technicalSkills = 55,
                }
            );
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                JsonSerializer.Serialize(
                    new { choices = new[] { new { message = new { content = attributesJson } } } }
                )
            );

            var result = await CreateSut(handler).GetProfileAttributesAsync(UserId);

            result.Independence.Should().Be(70);
            result.TechnicalSkills.Should().Be(55);
            _attributes.Verify(
                r =>
                    r.SaveAsync(
                        It.Is<ProfileAttributes>(a => a.UserId == UserId && a.Independence == 70)
                    ),
                Times.Once
            );
        }
    }
}
