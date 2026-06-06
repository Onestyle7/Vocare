using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _dashboardRepository;
        private readonly IUserProfileRepository _userProfileRepository;

        public DashboardService(
            IDashboardRepository dashboardRepository,
            IUserProfileRepository userProfileRepository
        )
        {
            _dashboardRepository = dashboardRepository;
            _userProfileRepository = userProfileRepository;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var recommendationsTask = await _dashboardRepository.GetRecommendationsCountAsync(
                userId
            );
            var analysesTask = await _dashboardRepository.GetAnalysesCountAsync(userId);
            var roadmapsTask = await _dashboardRepository.GetRoadmapsCountAsync(userId);
            var cvsTask = await _dashboardRepository.GetCvsCountAsync(userId);
            var profileTask = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            var financialTask = await _dashboardRepository.GetFinancialSurveyAsync(userId);

            var profile = profileTask;
            var financial = financialTask;

            var completion = CalculateProfileCompletionPercentage(profile);
            var salary = CalculateSalaryProgress(financial);

            return new DashboardSummaryDto
            {
                RecommendationsCount = recommendationsTask,
                AnalysesCount = analysesTask,
                RoadmapsCount = roadmapsTask,
                CvsCount = cvsTask,
                ProfileCompletionPercentage = completion,
                salaryProgressDto = salary,
            };
        }

        private int CalculateProfileCompletionPercentage(UserProfile profile)
        {
            int totalFields = 15;
            int completedField = 0;

            if (profile == null)
                return 0;

            if (!string.IsNullOrEmpty(profile.FirstName))
                completedField++;

            if (!string.IsNullOrEmpty(profile.LastName))
                completedField++;

            if (!string.IsNullOrEmpty(profile.Country))
                completedField++;

            if (!string.IsNullOrEmpty(profile.Address))
                completedField++;

            if (!string.IsNullOrEmpty(profile.PhoneNumber))
                completedField++;

            if (profile.Education != null && profile.Education.Count > 0)
                completedField++;

            if (profile.WorkExperience != null && profile.WorkExperience.Count > 0)
                completedField++;

            if (profile.Skills != null && profile.Skills.Count > 0)
                completedField++;

            if (profile.SoftSkills != null && profile.SoftSkills.Count > 0)
                completedField++;

            if (profile.Certificates != null && profile.Certificates.Count > 0)
                completedField++;

            if (profile.Languages != null && profile.Languages.Count > 0)
                completedField++;

            if (!string.IsNullOrEmpty(profile.AboutMe))
                completedField++;

            if (!string.IsNullOrEmpty(profile.AdditionalInformation))
                completedField++;

            if (profile.PersonalityType != Models.Enums.PersonalityType.Unknown)
                completedField++;

            if (profile.FinancialSurvey != null)
                completedField++;

            return (int)((double)completedField / totalFields * 100);
        }

        private SalaryProgressDto? CalculateSalaryProgress(FinancialSurvey survey)
        {
            if (survey == null)
                return null;

            var currentSalary = survey.CurrentSalary ?? 0;
            var targetSalary = survey.DesiredSalary ?? 0;

            var progressPercentage = 0.0;
            if (currentSalary != 0 && targetSalary != 0)
                progressPercentage = (double)currentSalary / (double)targetSalary * 100;

            return new SalaryProgressDto
            {
                CurrentSalary = currentSalary,
                ExpectedSalary = targetSalary,
                GoalCompletionPercentage = (int)progressPercentage,
            };
        }
    }
}
