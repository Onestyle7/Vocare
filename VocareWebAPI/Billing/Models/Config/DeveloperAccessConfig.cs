namespace VocareWebAPI.Billing.Models.Config
{
    public class DeveloperAccessConfig
    {
        public bool ForcePremiumEnabled { get; set; }
        public List<string> ForcePremiumUserIds { get; set; } = [];
        public List<string> ForcePremiumEmails { get; set; } = [];
    }
}
