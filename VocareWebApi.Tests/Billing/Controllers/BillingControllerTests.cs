using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Controllers;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Controllers
{
    /// <summary>
    /// Testy jednostkowe <see cref="BillingController"/> – walidacja wejścia, mapowanie
    /// wyników serwisów na odpowiedzi HTTP oraz reguły autoryzacji zasobu.
    /// </summary>
    public sealed class BillingControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IStripeService> _stripe = new(MockBehavior.Strict);
        private readonly Mock<IBillingService> _billing = new(MockBehavior.Strict);
        private readonly BillingController _sut;

        public BillingControllerTests()
        {
            _sut = new BillingController(
                _stripe.Object,
                _billing.Object,
                NullLogger<BillingController>.Instance
            );
            _sut.WithUser(UserId);
        }

        private static UserBilling Billing(
            int balance = 0,
            SubscriptionStatus status = SubscriptionStatus.None,
            string? subscriptionId = null
        ) =>
            new()
            {
                UserId = UserId,
                TokenBalance = balance,
                SubscriptionStatus = status,
                SubscriptionLevel = SubscriptionLevel.Monthly,
                StripeSubscriptionId = subscriptionId,
            };

        // ---------- CreateCheckoutSession ----------

        [Fact]
        public async Task CreateCheckoutSession_WithValidRequest_ReturnsOkWithUrl()
        {
            _stripe
                .Setup(s => s.CreateCheckoutSessionForTokenAsync(UserId, "price_1"))
                .ReturnsAsync("https://checkout.stripe.com/s/1");

            var result = await _sut.CreateCheckoutSession(
                new CreateCheckoutSessionRequestDto { PriceId = "price_1" }
            );

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value!.GetProperty("Url").Should().Be("https://checkout.stripe.com/s/1");
        }

        [Fact]
        public async Task CreateCheckoutSession_WithNullRequest_ReturnsBadRequest()
        {
            var result = await _sut.CreateCheckoutSession(null!);

            result
                .Should()
                .BeOfType<BadRequestObjectResult>()
                .Which.Value!.GetProperty("Error")
                .Should()
                .Be("PriceId is required.");
            _stripe.VerifyNoOtherCalls();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public async Task CreateCheckoutSession_WithEmptyPriceId_ReturnsBadRequest(string? priceId)
        {
            var result = await _sut.CreateCheckoutSession(
                new CreateCheckoutSessionRequestDto { PriceId = priceId! }
            );

            result.Should().BeOfType<BadRequestObjectResult>();
            _stripe.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task CreateCheckoutSession_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.CreateCheckoutSession(
                new CreateCheckoutSessionRequestDto { PriceId = "price_1" }
            );

            result.Should().BeOfType<BadRequestObjectResult>();
            _stripe.VerifyNoOtherCalls();
        }

        // ---------- CreateSubscriptionCheckout ----------

        [Fact]
        public async Task CreateSubscriptionCheckout_WithValidRequest_ReturnsOkWithUrl()
        {
            _stripe
                .Setup(s => s.CreateCheckoutSessionForSubscriptionAsync(UserId, "price_sub"))
                .ReturnsAsync("https://checkout.stripe.com/sub");

            var result = await _sut.CreateSubscriptionCheckout(
                new CreateCheckoutSessionRequestDto { PriceId = "price_sub" }
            );

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Url")
                .Should()
                .Be("https://checkout.stripe.com/sub");
        }

        [Fact]
        public async Task CreateSubscriptionCheckout_WithEmptyPriceId_ReturnsBadRequest()
        {
            var result = await _sut.CreateSubscriptionCheckout(
                new CreateCheckoutSessionRequestDto { PriceId = "" }
            );

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // ---------- GetAccessStatus ----------

        [Fact]
        public async Task GetAccessStatus_ReturnsTokenBalanceAndSubscriptionStatus()
        {
            _billing
                .Setup(b => b.GetUserBillingAsync(UserId))
                .ReturnsAsync(Billing(balance: 75, status: SubscriptionStatus.Active));

            var result = await _sut.GetAccessStatus();

            var value = result.Should().BeOfType<OkObjectResult>().Subject.Value!;
            value.GetProperty("tokenBalance").Should().Be(75);
            value.GetProperty("subscriptionStatus").Should().Be("Active");
        }

        // ---------- GetSubscriptionStatus ----------

        [Fact]
        public async Task GetSubscriptionStatus_ReturnsSubscriptionDetails()
        {
            var endDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            _billing
                .Setup(b => b.GetUserBillingAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.Active,
                        SubscriptionLevel = SubscriptionLevel.Monthly,
                        SubscriptionEndDate = endDate,
                        StripeSubscriptionId = "sub_1",
                    }
                );

            var result = await _sut.GetSubscriptionStatus();

            var value = result.Should().BeOfType<OkObjectResult>().Subject.Value!;
            value.GetProperty("subscriptionStatus").Should().Be("Active");
            value.GetProperty("subscriptionLevel").Should().Be("Monthly");
            value.GetProperty("subscriptionEndDate").Should().Be(endDate);
            value.GetProperty("subscriptionId").Should().Be("sub_1");
        }

        // ---------- Webhook ----------

        [Fact]
        public async Task Webhook_WithValidPayload_DelegatesToServiceAndReturnsOk()
        {
            const string json = "{\"type\":\"checkout.session.completed\"}";
            SetRequestBody(json, signature: "sig_header");
            _billing
                .Setup(b => b.HandleWebhookAsync(json, "sig_header"))
                .Returns(Task.CompletedTask);

            var result = await _sut.Webhook();

            result.Should().BeOfType<OkResult>();
            _billing.Verify(b => b.HandleWebhookAsync(json, "sig_header"), Times.Once);
        }

        [Fact]
        public async Task Webhook_WithoutSignatureHeader_ReturnsBadRequest()
        {
            SetRequestBody("{\"type\":\"x\"}", signature: null);

            var result = await _sut.Webhook();

            result.Should().BeOfType<BadRequestObjectResult>();
            _billing.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task Webhook_WithEmptyBody_ReturnsBadRequest()
        {
            SetRequestBody(string.Empty, signature: "sig");

            var result = await _sut.Webhook();

            result.Should().BeOfType<BadRequestObjectResult>();
            _billing.VerifyNoOtherCalls();
        }

        // ---------- CancelSubscription ----------

        [Fact]
        public async Task CancelSubscription_WithoutActiveSubscription_ThrowsNoActiveSubscription()
        {
            _billing
                .Setup(b => b.GetUserBillingAsync(UserId))
                .ReturnsAsync(Billing(subscriptionId: null));

            await _sut.Invoking(c => c.CancelSubscription())
                .Should()
                .ThrowAsync<NoActiveSubscriptionException>();
        }

        [Fact]
        public async Task CancelSubscription_WhenAlreadyCanceled_ThrowsConflict()
        {
            _billing
                .Setup(b => b.GetUserBillingAsync(UserId))
                .ReturnsAsync(
                    Billing(status: SubscriptionStatus.Canceled, subscriptionId: "sub_1")
                );

            await _sut.Invoking(c => c.CancelSubscription())
                .Should()
                .ThrowAsync<SubscriptionAlreadyCanceledException>();
        }

        [Fact]
        public async Task CancelSubscription_WithActiveSubscription_ReturnsPortalUrl()
        {
            _billing
                .Setup(b => b.GetUserBillingAsync(UserId))
                .ReturnsAsync(Billing(status: SubscriptionStatus.Active, subscriptionId: "sub_1"));
            _stripe
                .Setup(s => s.CreateCustomerPortalSessionAsync(UserId))
                .ReturnsAsync("https://billing.stripe.com/p/1");

            var result = await _sut.CancelSubscription();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Url")
                .Should()
                .Be("https://billing.stripe.com/p/1");
        }

        // ---------- CreateCustomerPortalSession ----------

        [Fact]
        public async Task CreateCustomerPortalSession_ReturnsOkWithUrl()
        {
            _stripe
                .Setup(s => s.CreateCustomerPortalSessionAsync(UserId))
                .ReturnsAsync("https://billing.stripe.com/portal");

            var result = await _sut.CreateCustomerPortalSession();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Url")
                .Should()
                .Be("https://billing.stripe.com/portal");
        }

        // ---------- GetPaymentHistory ----------

        [Fact]
        public async Task GetPaymentHistory_WithValidLimit_ReturnsPaymentsAndCount()
        {
            var payments = new List<PaymentHistoryDto>
            {
                new()
                {
                    Type = "token_purchase",
                    Amount = 5000,
                    Currency = "pln",
                    Status = "succeeded",
                },
            };
            _stripe.Setup(s => s.GetPaymentHistoryAsync(UserId, 25)).ReturnsAsync(payments);

            var result = await _sut.GetPaymentHistory(25);

            var value = result.Should().BeOfType<OkObjectResult>().Subject.Value!;
            value.GetProperty("count").Should().Be(1);
            value.GetProperty("payments").Should().BeSameAs(payments);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(101)]
        public async Task GetPaymentHistory_WithOutOfRangeLimit_ReturnsBadRequest(int limit)
        {
            var result = await _sut.GetPaymentHistory(limit);

            result.Should().BeOfType<BadRequestObjectResult>();
            _stripe.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetPaymentHistory_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetPaymentHistory();

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // ---------- Success / Cancel ----------

        [Fact]
        public void Success_ReturnsConfirmationMessage()
        {
            _sut.Success()
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Message")
                .Should()
                .Be("Payment successful. Thank you!");
        }

        [Fact]
        public void Cancel_ReturnsCancellationMessage()
        {
            _sut.Cancel()
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Message")
                .Should()
                .Be("Payment canceled.");
        }

        private void SetRequestBody(string json, string? signature)
        {
            var httpContext = _sut.ControllerContext.HttpContext;
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(json));
            if (signature is not null)
                httpContext.Request.Headers["Stripe-Signature"] = signature;
        }
    }
}
