using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CareerAdvisor.Exceptions
{
    public class MarketAnalysisNotFoundException : NotFoundException
    {
        public string UserId { get; }

        public MarketAnalysisNotFoundException(string userId)
            : base($"No market analysis found for the user {userId}", "MARKET_ANALYSIS_NOT_FOUND")
        {
            UserId = userId;
        }
    }
}
