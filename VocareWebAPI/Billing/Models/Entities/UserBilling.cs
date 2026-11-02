using System.ComponentModel.DataAnnotations;
using VocareWebAPI.Billing.Models.Enums;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class UserBilling
    {
        [Key]
        public required string UserId { get; set; } = string.Empty;
        public int TokenBalance { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public SubscriptionStatus SubscriptionStatus { get; set; }
        public SubscriptionLevel SubscriptionLevel { get; set; }
        public DateTime? LastTokenPurchaseDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public bool HasPremiumAccess =>
            SubscriptionStatus is SubscriptionStatus.Trialing or SubscriptionStatus.Active;
    }
}
