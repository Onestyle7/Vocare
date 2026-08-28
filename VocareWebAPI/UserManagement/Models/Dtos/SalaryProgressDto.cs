namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class SalaryProgressDto
    {
        public decimal CurrentSalary { get; set; }
        public decimal ExpectedSalary { get; set; }
        public int GoalCompletionPercentage { get; set; }
    }
}
