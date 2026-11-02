using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.Billing.Configuration
{
    public class TrialConfig
    {
        public const string SectionName = "Trial";

        [Range(0, 730, ErrorMessage = "Trial:TrialPeriodDays must be between 0 and 730")]
        public int TrialPeriodDays { get; set; }
    }
}
