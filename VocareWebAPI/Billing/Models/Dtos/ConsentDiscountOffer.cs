namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Rabat za zgodę marketingową w odpowiedzi dla frontu – bez CouponId, który jest tylko
    /// do użytku wewnętrznego (Checkout).
    /// </summary>
    public record ConsentDiscountOffer(int PercentOff, DateTime ExpiresAt)
    {
        public static ConsentDiscountOffer? From(ConsentDiscountInfo? info) =>
            info is null ? null : new(info.PercentOff, info.ExpiresAtUtc);
    }
}
