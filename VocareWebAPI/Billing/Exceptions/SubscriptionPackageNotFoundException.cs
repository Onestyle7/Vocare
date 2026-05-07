using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class SubscriptionPackageNotFoundException : NotFoundException
    {
        public string PriceId { get; }

        public SubscriptionPackageNotFoundException(string priceId)
            : base(
                $"Subscription package with priceId '{priceId}' not found.",
                "SUBSCRIPTION_PACKAGE_NOT_FOUND"
            )
        {
            PriceId = priceId;
        }
    }
}
