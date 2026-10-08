using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    /// <summary>
    /// Testy <see cref="PurchaseConfirmationService"/> – treść potwierdzenia zawarcia umowy
    /// wysyłanego na trwałym nośniku.
    /// </summary>
    public sealed class PurchaseConfirmationServiceTests
    {
        private static LegalOptions Legal(string? address = null) =>
            new()
            {
                ProviderName = "Kacper Jóźwik",
                ProviderAddress = address,
                ContactEmail = "kontakt@vocare.pl",
                FrontendUrl = "https://vocare.pl/",
            };

        private static readonly byte[] TermsPdf = { 0x25, 0x50, 0x44, 0x46, 0x2D };

        private static PurchaseConfirmationService CreateSut(
            IEmailService emailService,
            FakeHttpMessageHandler pdfHandler
        )
        {
            var factory = new Mock<IHttpClientFactory>();
            factory
                .Setup(f => f.CreateClient(It.IsAny<string>()))
                .Returns(new HttpClient(pdfHandler));

            return new PurchaseConfirmationService(
                emailService,
                factory.Object,
                Options.Create(Legal()),
                NullLogger<PurchaseConfirmationService>.Instance
            );
        }

        private static FakeHttpMessageHandler PdfReturning() =>
            FakeHttpMessageHandler.Returning(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(TermsPdf),
                }
            );

        private static PurchaseConfirmationDto Confirmation(string mode = "payment") =>
            new()
            {
                Email = "jan@example.com",
                SessionId = "cs_test_123",
                CheckoutMode = mode,
                PackageName = mode == "subscription" ? "Premium" : "Pakiet 500 tokenów",
                AmountTotal = mode == "subscription" ? 2900 : 1900,
                Currency = "pln",
                PurchasedAtUtc = new DateTime(2026, 10, 7, 10, 0, 0, DateTimeKind.Utc),
            };

        [Fact]
        public void BuildBody_ForTokenPackage_ContainsContractDetailsAndWithdrawalInfo()
        {
            var body = PurchaseConfirmationService.BuildBody(Confirmation(), Legal());

            body.Should().Contain("Pakiet 500 tokenów (Pakiet Tokenów – płatność jednorazowa)");
            body.Should().Contain("Cena: 19,00 PLN");
            body.Should().Contain("Numer zamówienia: cs_test_123");
            body.Should().Contain("zwrócimy całą wpłatę");
            body.Should().Contain("Regulaminie dołączonym do tej wiadomości");
            body.Should().Contain("https://vocare.pl/terms-of-service");
            body.Should().Contain("kontakt@vocare.pl");
            body.Should().NotContain("anulować");
        }

        [Fact]
        public void BuildBody_ForSubscription_DescribesRenewalAndCancellation()
        {
            var body = PurchaseConfirmationService.BuildBody(Confirmation("subscription"), Legal());

            body.Should().Contain("odnawiana automatycznie co miesiąc");
            body.Should().Contain("Subskrypcję możesz anulować w każdej chwili");
        }

        [Fact]
        public void BuildBody_IncludesProviderAddressOnlyWhenConfigured()
        {
            var withoutAddress = PurchaseConfirmationService.BuildBody(Confirmation(), Legal());
            var withAddress = PurchaseConfirmationService.BuildBody(
                Confirmation(),
                Legal("ul. Testowa 1, 00-001 Warszawa")
            );

            withoutAddress.Should().Contain("Usługodawca: Kacper Jóźwik" + Environment.NewLine);
            withAddress
                .Should()
                .Contain("Usługodawca: Kacper Jóźwik, ul. Testowa 1, 00-001 Warszawa");
        }

        [Fact]
        public async Task SendPurchaseConfirmationAsync_SendsEmailWithTermsPdfAttached()
        {
            var email = new Mock<IEmailService>(MockBehavior.Strict);
            IReadOnlyCollection<EmailAttachment>? sentAttachments = null;
            email
                .Setup(e =>
                    e.SendEmailAsync(
                        "jan@example.com",
                        "Potwierdzenie zamówienia – Pakiet 500 tokenów",
                        It.Is<string>(b => b.Contains("Numer zamówienia: cs_test_123")),
                        It.IsAny<IReadOnlyCollection<EmailAttachment>>()
                    )
                )
                .Callback<string, string, string, IReadOnlyCollection<EmailAttachment>>(
                    (_, _, _, attachments) => sentAttachments = attachments
                )
                .Returns(Task.CompletedTask);
            var pdfHandler = PdfReturning();

            await CreateSut(email.Object, pdfHandler).SendPurchaseConfirmationAsync(Confirmation());

            pdfHandler
                .LastRequest!.RequestUri!.ToString()
                .Should()
                .Be("https://vocare.pl/terms-of-service/pdf");
            sentAttachments.Should().ContainSingle();
            sentAttachments!.Single().FileName.Should().Be("regulamin-vocare.pdf");
            sentAttachments!.Single().Content.Should().Equal(TermsPdf);
        }

        [Fact]
        public async Task SendPurchaseConfirmationAsync_WhenTermsPdfUnavailable_ThrowsWithoutSendingEmail()
        {
            var email = new Mock<IEmailService>(MockBehavior.Strict);
            var pdfHandler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.ServiceUnavailable,
                "down",
                "text/plain"
            );

            await CreateSut(email.Object, pdfHandler)
                .Invoking(s => s.SendPurchaseConfirmationAsync(Confirmation()))
                .Should()
                .ThrowAsync<HttpRequestException>();

            email.VerifyNoOtherCalls();
        }
    }
}
