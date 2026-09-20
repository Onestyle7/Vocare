using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Buduje realną instancję <see cref="IConfiguration"/> z par klucz/wartość –
    /// prostsze i bardziej wiarygodne niż mockowanie indexerów <c>IConfiguration</c>.
    /// </summary>
    public static class TestConfiguration
    {
        public static IConfiguration FromValues(params (string Key, string? Value)[] values)
        {
            var dict = new Dictionary<string, string?>();
            foreach (var (key, value) in values)
                dict[key] = value;

            return new ConfigurationBuilder().AddInMemoryCollection(dict).Build();
        }

        /// <summary>Konfiguracja z typowymi kluczami Stripe wymaganymi przez serwisy Billing.</summary>
        public static IConfiguration Stripe(
            string webhookSecret = "whsec_test",
            string successUrl = "https://app.test/success",
            string cancelUrl = "https://app.test/cancel",
            string returnUrl = "https://app.test/dashboard"
        ) =>
            FromValues(
                ("Stripe:WebhookSecret", webhookSecret),
                ("Stripe:SuccessUrl", successUrl),
                ("Stripe:CancelUrl", cancelUrl),
                ("Stripe:ReturnUrl", returnUrl)
            );
    }
}
