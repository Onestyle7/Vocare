using FluentAssertions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using Xunit;

namespace VocareWebApi.Tests.Billing.Models
{
    /// <summary>Testy reguły dostępu premium na <see cref="UserBilling"/>.</summary>
    public sealed class UserBillingTests
    {
        [Theory]
        [InlineData(SubscriptionStatus.None, false)]
        [InlineData(SubscriptionStatus.Active, true)]
        [InlineData(SubscriptionStatus.Trialing, true)]
        [InlineData(SubscriptionStatus.Canceled, false)]
        [InlineData(SubscriptionStatus.PastDue, false)]
        public void HasPremiumAccess_IsGrantedOnlyForActiveAndTrialing(
            SubscriptionStatus status,
            bool expected
        )
        {
            var billing = new UserBilling { UserId = "user-1", SubscriptionStatus = status };

            billing.HasPremiumAccess.Should().Be(expected);
        }
    }
}
