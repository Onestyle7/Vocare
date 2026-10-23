namespace VocareWebAPI.Billing.Models.Enums
{
    public enum TransactionType
    {
        Purchase = 0,
        Usage = 1,
        WelcomeBonus = 2,

        /// <summary>Przyznanie rabatu na tokeny za zgodę marketingową (Amount = 0).</summary>
        ConsentDiscountGranted = 3,

        /// <summary>Wykorzystanie rabatu za zgodę przy zakupie tokenów (Amount = 0).</summary>
        ConsentDiscountRedeemed = 4,
    }
}
