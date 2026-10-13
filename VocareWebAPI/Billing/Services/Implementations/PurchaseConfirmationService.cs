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
        private readonly LegalOptions _legal;
        private readonly ILogger<PurchaseConfirmationService> _logger;

        public PurchaseConfirmationService(
            IEmailService emailService,
            IHttpClientFactory httpClientFactory,
            IOptions<LegalOptions> legalOptions,
            ILogger<PurchaseConfirmationService> logger
        )
        {
            _emailService = emailService;
            _httpClientFactory = httpClientFactory;
            _legal = legalOptions.Value;
            _logger = logger;
        }

        public async Task SendPurchaseConfirmationAsync(PurchaseConfirmationDto confirmation)
        {
            var subject = $"Potwierdzenie zamówienia – {confirmation.PackageName}";
            var body = BuildBody(confirmation, _legal);

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

        public static string BuildBody(PurchaseConfirmationDto confirmation, LegalOptions legal)
        {
            var isSubscription = confirmation.CheckoutMode == "subscription";
            var serviceDescription = isSubscription
                ? "Subskrypcja Premium – odnawiana automatycznie co miesiąc do czasu anulowania"
                : "Pakiet Tokenów – płatność jednorazowa";

            var body = new StringBuilder()
                .AppendLine("Dzień dobry,")
                .AppendLine()
                .AppendLine("potwierdzamy zawarcie umowy w serwisie Vocare (vocare.pl).")
                .AppendLine()
                .AppendLine($"Usługa: {confirmation.PackageName} ({serviceDescription})")
                .AppendLine(
                    $"Cena: {FormatAmount(confirmation.AmountTotal, confirmation.Currency)}"
                )
                .AppendLine($"Data zawarcia umowy: {FormatDate(confirmation.PurchasedAtUtc)}")
                .AppendLine($"Numer zamówienia: {confirmation.SessionId}")
                .AppendLine();

            body.AppendLine(
                    $"Masz 14 dni na odstąpienie od umowy bez podania przyczyny – wystarczy napisać na {legal.ContactEmail}, a zwrócimy całą wpłatę. Szczegóły i wzór formularza odstąpienia znajdziesz w Regulaminie dołączonym do tej wiadomości."
                )
                .AppendLine();

            if (isSubscription)
            {
                body.AppendLine(
                        "Subskrypcję możesz anulować w każdej chwili w ustawieniach płatności na Koncie – dostęp zachowasz do końca opłaconego okresu."
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

        private static string FormatAmount(long? amountTotal, string? currency)
        {
            if (amountTotal is null)
                return "zgodnie z Cennikiem";

            var amount = amountTotal.Value / 100m;
            return $"{amount.ToString("N2", Polish)} {(currency ?? "pln").ToUpperInvariant()}";
        }

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
