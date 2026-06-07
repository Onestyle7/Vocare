using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class InactiveSubscriptionPackageException : BusinessRuleException
    {
        public string PriceId { get; }

        public InactiveSubscriptionPackageException(string priceId)
            : base(
                $"Subscription package with priceId '{priceId}' is no longer active",
                "INACTIVE_SUBSCRIPTION_PACKAGE"
            )
        {
            PriceId = priceId;
        }
    }
}
