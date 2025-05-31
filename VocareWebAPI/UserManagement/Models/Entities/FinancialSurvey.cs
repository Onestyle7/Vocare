using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    /// <summary>
    /// Ankieta finansowa użytkownika – PK i FK do UserProfile(UserId)
    /// </summary>
    public class FinancialSurvey
    {
        [Key]
        public string UserId { get; set; } = default!;

        [ForeignKey(nameof(UserId))]
        public UserProfile UserProfile { get; set; } = default!;

        public decimal? CurrentSalary { get; set; }
        public decimal? DesiredSalary { get; set; }
        public bool HasLoans { get; set; } = false;
        public string? LoanDetails { get; set; }
        public Risk RiskAppetite { get; set; } = Risk.Unknown;
        public bool WillingToRelocate { get; set; } = false;
    }
}
