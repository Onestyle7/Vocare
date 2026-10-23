using System;
using System.Security.Cryptography;
using System.Text;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Buduje ładunki webhooków Stripe wraz z prawidłowym nagłówkiem podpisu, tak aby
    /// <see cref="Stripe.EventUtility"/> zaakceptował je w testach (ten sam algorytm
    /// HMAC-SHA256 co po stronie Stripe).
    /// </summary>
    public static class StripeWebhookFactory
    {
        /// <summary>Zwraca nagłówek <c>Stripe-Signature</c> dla podanego ładunku i sekretu.</summary>
        public static string SignPayload(
            string payload,
            string secret,
            DateTimeOffset? timestamp = null
        )
        {
            var ts = (timestamp ?? DateTimeOffset.UtcNow).ToUnixTimeSeconds();
            var signedPayload = $"{ts}.{payload}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
            var signature = Convert.ToHexString(hash).ToLowerInvariant();

            return $"t={ts},v1={signature}";
        }

        /// <summary>
        /// Event <c>checkout.session.completed</c> w trybie <paramref name="mode"/> z podanymi
        /// metadanymi. Zwraca surowy JSON gotowy do podpisania.
        /// </summary>
        public static string CheckoutSessionCompleted(
            string mode = "payment",
            (string Key, string Value)[]? metadata = null,
            string sessionId = "cs_test_123",
            string? customerEmail = null,
            long amountTotal = 1900
        )
        {
            var customerDetails = customerEmail is null
                ? "null"
                : $$"""{ "email": "{{customerEmail}}" }""";
            var dataObject = $$"""
                {
                  "id": "{{sessionId}}",
                  "object": "checkout.session",
                  "mode": "{{mode}}",
                  "amount_total": {{amountTotal}},
                  "currency": "pln",
                  "customer_details": {{customerDetails}},
                  "metadata": {{BuildMetadata(metadata)}}
                }
                """;
            return Envelope("checkout.session.completed", dataObject);
        }

        /// <summary>
        /// Event <c>customer.subscription.*</c> z podanym statusem Stripe (np. <c>trialing</c>).
        /// </summary>
        public static string SubscriptionEvent(
            string type,
            string status,
            string customerId = "cus_test",
            string subscriptionId = "sub_test",
            string subscriptionLevel = "Monthly"
        )
        {
            var dataObject = $$"""
                {
                  "id": "{{subscriptionId}}",
                  "object": "subscription",
                  "customer": "{{customerId}}",
                  "status": "{{status}}",
                  "metadata": { "subscriptionLevel": "{{subscriptionLevel}}" },
                  "items": { "object": "list", "data": [] }
                }
                """;
            return Envelope(type, dataObject);
        }

        /// <summary>Event <c>invoice.payment_succeeded</c> z podaną kwotą zapłaconą.</summary>
        public static string InvoicePaymentSucceeded(
            long amountPaid,
            string customerId = "cus_test"
        )
        {
            var dataObject = $$"""
                {
                  "id": "in_test",
                  "object": "invoice",
                  "customer": "{{customerId}}",
                  "amount_paid": {{amountPaid}},
                  "lines": { "object": "list", "data": [] }
                }
                """;
            return Envelope("invoice.payment_succeeded", dataObject);
        }

        /// <summary>Event o dowolnym typie z generycznym obiektem danych.</summary>
        public static string GenericEvent(string type) =>
            Envelope(type, """{ "id": "obj_test", "object": "thing" }""");

        private static string Envelope(string type, string dataObjectJson)
        {
            var created = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            return $$"""
                {
                  "id": "evt_test_{{Guid.NewGuid():N}}",
                  "object": "event",
                  "api_version": "2024-06-20",
                  "created": {{created}},
                  "livemode": false,
                  "pending_webhooks": 0,
                  "request": { "id": null, "idempotency_key": null },
                  "type": "{{type}}",
                  "data": {
                    "object": {{dataObjectJson}}
                  }
                }
                """;
        }

        private static string BuildMetadata((string Key, string Value)[]? metadata)
        {
            if (metadata is null || metadata.Length == 0)
                return "{}";

            var sb = new StringBuilder("{");
            for (var i = 0; i < metadata.Length; i++)
            {
                var (key, value) = metadata[i];
                sb.Append('"').Append(key).Append("\": \"").Append(value).Append('"');
                if (i < metadata.Length - 1)
                    sb.Append(", ");
            }
            sb.Append('}');
            return sb.ToString();
        }
    }
}
