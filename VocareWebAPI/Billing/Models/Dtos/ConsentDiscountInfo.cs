namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Aktywny rabat za zgodę marketingową. CouponId jest tylko do użytku wewnętrznego
    /// (Checkout) – nie zwracamy go na front.
    /// </summary>
    public record ConsentDiscountInfo(string CouponId, int PercentOff, DateTime ExpiresAtUtc);
}
