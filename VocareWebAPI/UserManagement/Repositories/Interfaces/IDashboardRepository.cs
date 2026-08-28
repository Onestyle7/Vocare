using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces
{
    public interface IDashboardRepository
    {
        Task<int> GetRecommendationsCountAsync(string userId);
        Task<int> GetAnalysesCountAsync(string userId);
        Task<int> GetRoadmapsCountAsync(string userId);
        Task<int> GetCvsCountAsync(string userId);
        Task<FinancialSurvey?> GetFinancialSurveyAsync(string userId);
    }
}
