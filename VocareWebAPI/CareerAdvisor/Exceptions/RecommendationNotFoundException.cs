using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CareerAdvisor.Exceptions
{
    public class RecommendationNotFoundException : NotFoundException
    {
        public string UserId { get; }

        public RecommendationNotFoundException(string userId)
            : base($"No recommendations found for the user {userId}", "RECOMMENDATION_NOT_FOUND")
        {
            UserId = userId;
        }

        public RecommendationNotFoundException(Guid recommendationId)
            : base(
                $"Recommendation with ID {recommendationId} not found.",
                "RECOMMENDATION_NOT_FOUND"
            ) { }
    }
}
