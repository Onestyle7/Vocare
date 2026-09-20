using Xunit;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Kolekcja xUnit grupująca testy, które dotykają statycznego stanu konfiguracji Stripe
    /// (<c>TokenPackagesConfiguration</c>, <c>SubscriptionPackagesConfiguration</c>), aby nie
    /// wykonywały się równolegle i nie zakłócały się nawzajem.
    /// </summary>
    [CollectionDefinition(Name, DisableParallelization = true)]
    public sealed class StripeStaticsCollection
    {
        public const string Name = "Stripe statics";
    }
}
