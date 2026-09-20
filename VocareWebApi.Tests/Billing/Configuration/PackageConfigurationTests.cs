using System.Collections.Generic;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Configuration
{
    /// <summary>
    /// Testy statycznych rejestrów pakietów. Współdzielą kolekcję ze <c>StripeServiceTests</c>,
    /// ponieważ obie klasy modyfikują ten sam globalny stan (<c>_packages</c>).
    /// </summary>
    [Collection(StripeStaticsCollection.Name)]
    public sealed class PackageConfigurationTests
    {
        [Fact]
        public void TokenPackages_WhenConfigurationProvided_ExposesConfiguredPackage()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["TokenPackages:0:PriceId"] = "price_custom",
                        ["TokenPackages:0:Name"] = "Test Package",
                        ["TokenPackages:0:TokenAmount"] = "123",
                        ["TokenPackages:0:Price"] = "99.00",
                        ["TokenPackages:0:Currency"] = "pln",
                    }
                )
                .Build();

            TokenPackagesConfiguration.Initialize(configuration);

            var package = TokenPackagesConfiguration.GetPackageByPriceId("price_custom");
            package.Should().NotBeNull();
            package!.TokenAmount.Should().Be(123);
            package.Currency.Should().Be("pln");
        }

        [Fact]
        public void TokenPackages_WhenConfigurationEmpty_FallsBackToDefaults()
        {
            TokenPackagesConfiguration.Initialize(EmptyConfiguration());

            TokenPackagesConfiguration.Packages.Should().NotBeEmpty();
            TokenPackagesConfiguration
                .GetPackageByPriceId("price_1RDpyOLs2ndSVWb2TVahQNgY")
                .Should()
                .NotBeNull();
        }

        [Fact]
        public void TokenPackages_GetPackageByPriceId_ForUnknownId_ReturnsNull()
        {
            TokenPackagesConfiguration.Initialize(EmptyConfiguration());

            TokenPackagesConfiguration.GetPackageByPriceId("nope").Should().BeNull();
        }

        [Fact]
        public void SubscriptionPackages_WhenConfigurationProvided_ExposesConfiguredPackage()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["SubscriptionPackages:0:PriceId"] = "price_sub_custom",
                        ["SubscriptionPackages:0:Name"] = "Pro",
                        ["SubscriptionPackages:0:Price"] = "49.99",
                        ["SubscriptionPackages:0:Level"] = nameof(SubscriptionLevel.Monthly),
                        ["SubscriptionPackages:0:IsActive"] = "true",
                    }
                )
                .Build();

            SubscriptionPackagesConfiguration.Initialize(configuration);

            var package = SubscriptionPackagesConfiguration.GetPackageByPriceId("price_sub_custom");
            package.Should().NotBeNull();
            package!.Level.Should().Be(SubscriptionLevel.Monthly);
            package.IsActive.Should().BeTrue();
        }

        [Fact]
        public void SubscriptionPackages_GetActivePackages_ExcludesInactive()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["SubscriptionPackages:0:PriceId"] = "price_active",
                        ["SubscriptionPackages:0:IsActive"] = "true",
                        ["SubscriptionPackages:1:PriceId"] = "price_inactive",
                        ["SubscriptionPackages:1:IsActive"] = "false",
                    }
                )
                .Build();

            SubscriptionPackagesConfiguration.Initialize(configuration);

            SubscriptionPackagesConfiguration
                .GetActivePackages()
                .Should()
                .OnlyContain(p => p.PriceId == "price_active");
        }

        private static IConfiguration EmptyConfiguration() =>
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();
    }
}
