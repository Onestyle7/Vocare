namespace VocareWebAPI.Models.Entities
{
    public class AccountAntiAbuseRegistry
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string EmailHash { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool HadWelcomeBonus { get; set; } = true;
    }
}
