namespace VocareWebAPI.Models.Entities
{
    public class AccountAntiAbuseRegistry
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string EmailHash { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool HadWelcomeBonus { get; set; } = true;

        // Trial i rabat za zgodę przysługują raz na osobę – ponowna rejestracja na ten sam
        // e-mail po usunięciu konta ich nie odnawia
        public bool HadSubscription { get; set; }
        public bool HadConsentDiscount { get; set; }
    }
}
