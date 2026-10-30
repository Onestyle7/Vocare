using System.Globalization;
using System.Text;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.Billing.Services.Implementations
{
    /// <summary>
    /// Wysyła potwierdzenie zawarcia umowy na trwałym nośniku (e-mail) z Regulaminem w PDF,
    /// który zawiera informacje z art. 12 ust. 1 UoPK, w tym wzór formularza odstąpienia
    /// (art. 21 ust. 1 ustawy o prawach konsumenta).
    /// </summary>
    public class PurchaseConfirmationService : IPurchaseConfirmationService
    {
        private static readonly CultureInfo Polish = CultureInfo.GetCultureInfo("pl-PL");

        public const string TermsAttachmentFileName = "regulamin-vocare.pdf";

        private readonly IEmailService _emailService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly Stripe.SubscriptionService _subscriptionService;
        private readonly LegalOptions _legal;
        private readonly ILogger<PurchaseConfirmationService> _logger;

        public PurchaseConfirmationService(
            IEmailService emailService,
            IHttpClientFactory httpClientFactory,
            Stripe.SubscriptionService subscriptionService,
            IOptions<LegalOptions> legalOptions,
            ILogger<PurchaseConfirmationService> logger
        )
        {
            _emailService = emailService;
            _httpClientFactory = httpClientFactory;
            _subscriptionService = subscriptionService;
            _legal = legalOptions.Value;
            _logger = logger;
        }

        public async Task SendPurchaseConfirmationAsync(PurchaseConfirmationDto confirmation)
        {
            // Warunki subskrypcji (trial, cena cykliczna) bierzemy ze Stripe, bo to on pobiera
            // płatności – błąd przerywa zadanie, a Hangfire ponawia wysyłkę
            var subscription = await GetSubscriptionDetailsAsync(confirmation.SubscriptionId);

            var subject = $"Potwierdzenie zamówienia – {confirmation.PackageName}";
            var body = BuildBody(confirmation, _legal, subscription);

            // Bez Regulaminu w załączniku potwierdzenie jest niepełne – błąd pobrania przerywa
            // zadanie, a Hangfire ponawia wysyłkę
            var termsPdf = await _httpClientFactory
                .CreateClient()
                .GetByteArrayAsync(_legal.TermsPdfUrl);

            await _emailService.SendEmailAsync(
                confirmation.Email,
                subject,
                body,
                new[] { new EmailAttachment(TermsAttachmentFileName, termsPdf) }
            );

            _logger.LogInformation(
                "Purchase confirmation sent for session {SessionId}",
                confirmation.SessionId
            );
        }

        private async Task<SubscriptionDetails?> GetSubscriptionDetailsAsync(string? subscriptionId)
        {
            if (string.IsNullOrEmpty(subscriptionId))
                return null;

            var subscription = await _subscriptionService.GetAsync(subscriptionId);
            var price = subscription.Items?.Data?.FirstOrDefault()?.Price;

            return new SubscriptionDetails(
                subscription.TrialEnd,
                price?.UnitAmount,
                price?.Currency,
                price?.Recurring?.Interval ?? "month",
                price?.Recurring?.IntervalCount ?? 1
            );
        }

        public static string BuildBody(
            PurchaseConfirmationDto confirmation,
            LegalOptions legal,
            SubscriptionDetails? subscription = null
        )
        {
            var isSubscription = confirmation.CheckoutMode == "subscription";
            var trialEnd = isSubscription ? subscription?.TrialEndUtc : null;
            var renewal = subscription is null
                ? "co miesiąc"
                : FormatInterval(subscription.Interval, subscription.IntervalCount);
            var recurringPrice = subscription?.RecurringAmount is null
                ? null
                : FormatAmount(subscription.RecurringAmount, subscription.Currency);

            var serviceDescription =
                !isSubscription ? "Pakiet Tokenów – płatność jednorazowa"
                : trialEnd is null
                    ? $"Subskrypcja Premium – odnawiana automatycznie {renewal} do czasu anulowania"
                : $"Subskrypcja Premium – bezpłatny okres próbny, następnie odnawiana automatycznie {renewal} do czasu anulowania";

            var price = FormatAmount(confirmation.AmountTotal, confirmation.Currency);
            if (trialEnd is not null && recurringPrice is not null)
                price =
                    $"{price} do {FormatDay(trialEnd.Value)}, następnie {recurringPrice} {renewal}";
            else if (isSubscription && recurringPrice is not null)
                price = $"{recurringPrice} {renewal}";

            var body = new StringBuilder()
                .AppendLine("Dzień dobry,")
                .AppendLine()
                .AppendLine("potwierdzamy zawarcie umowy w serwisie Vocare (vocare.pl).")
                .AppendLine()
                .AppendLine($"Usługa: {confirmation.PackageName} ({serviceDescription})")
                .AppendLine($"Cena: {price}");

            if (trialEnd is not null)
                body.AppendLine($"Data pierwszej płatności: {FormatDate(trialEnd.Value)}");

            body.AppendLine($"Data zawarcia umowy: {FormatDate(confirmation.PurchasedAtUtc)}")
                .AppendLine($"Numer zamówienia: {confirmation.SessionId}")
                .AppendLine();

            if (trialEnd is not null)
            {
                // Przy trialu wpłata wynosi 0 zł – nie obiecujemy zwrotu, tylko opisujemy
                // jak uniknąć pierwszej płatności
                var chargeInfo = recurringPrice is null
                    ? "pobierzemy pierwszą płatność zgodnie z Cennikiem"
                    : $"pobierzemy {recurringPrice}";
                body.AppendLine(
                        $"Okres próbny jest bezpłatny. Jeśli anulujesz subskrypcję przed {FormatDate(trialEnd.Value)}, nie zapłacisz nic. W przeciwnym razie tego dnia {chargeInfo}, a subskrypcja będzie odnawiana automatycznie {renewal}."
                    )
                    .AppendLine()
                    .AppendLine(
                        $"Masz 14 dni od zawarcia umowy na odstąpienie od niej bez podania przyczyny – wystarczy napisać na {legal.ContactEmail}. Szczegóły i wzór formularza odstąpienia znajdziesz w Regulaminie dołączonym do tej wiadomości."
                    )
                    .AppendLine();
            }
            else
            {
                body.AppendLine(
                        $"Masz 14 dni na odstąpienie od umowy bez podania przyczyny – wystarczy napisać na {legal.ContactEmail}, a zwrócimy całą wpłatę. Szczegóły i wzór formularza odstąpienia znajdziesz w Regulaminie dołączonym do tej wiadomości."
                    )
                    .AppendLine();
            }

            if (isSubscription)
            {
                // W trialu nie ma opłaconego okresu – dostęp trwa do końca okresu próbnego
                var accessUntil = trialEnd is null
                    ? "do końca opłaconego okresu"
                    : "do końca okresu próbnego";
                body.AppendLine(
                        $"Subskrypcję możesz anulować w każdej chwili w ustawieniach płatności na Koncie – dostęp zachowasz {accessUntil}."
                    )
                    .AppendLine();
            }

            body.AppendLine($"Regulamin: {legal.TermsUrl}")
                .AppendLine($"Polityka prywatności: {legal.PrivacyPolicyUrl}")
                .AppendLine()
                .Append($"Usługodawca: {legal.ProviderName}");

            if (!string.IsNullOrWhiteSpace(legal.ProviderAddress))
                body.Append($", {legal.ProviderAddress}");

            body.AppendLine()
                .AppendLine($"Kontakt: {legal.ContactEmail}")
                .AppendLine()
                .AppendLine("Pozdrawiamy,")
                .Append("Zespół Vocare");

            return body.ToString();
        }

        /// <summary>
        /// Opis okresu rozliczeniowego ze Stripe, np. „co miesiąc”, „co 3 miesiące”, „co rok”.
        /// </summary>
        public static string FormatInterval(string interval, long count)
        {
            var (one, few, many) = interval switch
            {
                "day" => ("dzień", "dni", "dni"),
                "week" => ("tydzień", "tygodnie", "tygodni"),
                "year" => ("rok", "lata", "lat"),
                _ => ("miesiąc", "miesiące", "miesięcy"),
            };

            if (count <= 1)
                return $"co {one}";

            var isFewForm = count % 10 is >= 2 and <= 4 && count % 100 is < 12 or > 14;
            return $"co {count} {(isFewForm ? few : many)}";
        }

        private static string FormatAmount(long? amountTotal, string? currency)
        {
            if (amountTotal is null)
                return "zgodnie z Cennikiem";

            var amount = amountTotal.Value / 100m;
            return $"{amount.ToString("N2", Polish)} {(currency ?? "pln").ToUpperInvariant()}";
        }

        private static string FormatDay(DateTime utc) => FormatDate(utc)[..10];

        private static string FormatDate(DateTime utc)
        {
            var asUtc = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
            try
            {
                var warsaw = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
                return TimeZoneInfo
                    .ConvertTimeFromUtc(asUtc, warsaw)
                    .ToString("dd.MM.yyyy HH:mm", Polish);
            }
            catch (TimeZoneNotFoundException)
            {
                return asUtc.ToString("dd.MM.yyyy HH:mm 'UTC'", Polish);
            }
        }
    }
}
