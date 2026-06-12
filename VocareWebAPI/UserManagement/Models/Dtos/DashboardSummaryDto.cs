namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class DashboardSummaryDto
    {
        public int RecommendationsCount { get; set; }
        public int AnalysesCount { get; set; }
        public int RoadmapsCount { get; set; }
        public int CvsCount { get; set; }
        public int ProfileCompletionPercentage { get; set; }
        public SalaryProgressDto salaryProgressDto { get; set; }
    }
}
