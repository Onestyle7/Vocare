using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using Xunit;

namespace VocareWebApi.Tests.Utilities
{
    public static class TestDataBuilders
    {
        public class UserBuilder
        {
            private User _user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = "test@example.com",
                UserName = "test@example.com",
            };

            public UserBuilder WithId(string id)
            {
                _user.Id = id;
                return this;
            }

            public UserBuilder WithEmail(string email)
            {
                _user.Email = email;
                _user.UserName = email;
                return this;
            }

            public User Build() => _user;
        }

        public class AiRecommendationBuilder
        {
            private AiRecommendation _recommendation = new AiRecommendation
            {
                Id = Guid.NewGuid(),
                UserId = "test-user",
                RecommendationDate = DateTime.UtcNow,
                PrimaryPath = "Software Developer",
                Justification = "Based on your skills",
                LongTermGoal = "Become a senior developer",
                CareerPaths = new List<CareerPath>(),
                NextSteps = new List<NextStep>(),
            };

            public AiRecommendationBuilder WithUserId(string userId)
            {
                _recommendation.UserId = userId;
                return this;
            }

            public AiRecommendationBuilder WithCareerPaths(params string[] paths)
            {
                _recommendation.CareerPaths = paths
                    .Select(p => new CareerPath
                    {
                        Id = Guid.NewGuid(),
                        CareerName = p,
                        Description = $"Description for {p}",
                        Probability = "75",
                    })
                    .ToList();
                return this;
            }

            public AiRecommendation Build() => _recommendation;
        }
    }
}
