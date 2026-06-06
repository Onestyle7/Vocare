using VocareWebAPI.UserManagement.Models.Dtos;

namespace VocareWebAPI.UserManagement.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(string userId);
        Task<ProfileAttributesDto> GetProfileAttributesAsync(string userId);
    }
}
