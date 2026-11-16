using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Legal.Controllers;
using VocareWebAPI.Legal.Models.Dtos;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Implementations;
using VocareWebAPI.Legal.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.Legal
{
    /// <summary>
    /// Cookie banner decisions are appended to a server-side log (GDPR art. 7(1)):
    /// request validation, mapping to the entity and the controller action.
    /// </summary>
    public sealed class CookieConsentRecordingTests
    {
        private const string UserId = "user-test-123";
        private static readonly Guid ConsentId = Guid.NewGuid();

        private static RecordCookieConsentRequestDto ValidRequest() =>
            new()
            {
                ConsentId = ConsentId,
                AnalyticsGranted = true,
                AdsGranted = false,
                Source = CookieConsentSource.Banner,
                TextVersion = "2026-11-13",
            };

        private static List<ValidationResult> Validate(RecordCookieConsentRequestDto request)
        {
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true
            );
            return results;
        }

        // ---------- DTO validation ----------

        [Fact]
        public void Validation_ValidRequest_HasNoErrors()
        {
            Validate(ValidRequest()).Should().BeEmpty();
        }

        [Fact]
        public void Validation_EmptyConsentId_IsRejected()
        {
            var request = ValidRequest();
            request.ConsentId = Guid.Empty;

            Validate(request)
                .Should()
                .ContainSingle()
                .Which.MemberNames.Should()
                .Contain(nameof(RecordCookieConsentRequestDto.ConsentId));
        }

        [Fact]
        public void Validation_MissingChoices_AreRejected_InsteadOfDefaultingToDenied()
        {
            var request = ValidRequest();
            request.AnalyticsGranted = null;
            request.AdsGranted = null;

            Validate(request)
                .SelectMany(r => r.MemberNames)
                .Should()
                .BeEquivalentTo(
                    nameof(RecordCookieConsentRequestDto.AnalyticsGranted),
                    nameof(RecordCookieConsentRequestDto.AdsGranted)
                );
        }

        [Theory]
        [InlineData(null)]
        [InlineData(99)]
        public void Validation_MissingOrUnknownSource_IsRejected(int? source)
        {
            var request = ValidRequest();
            request.Source = (CookieConsentSource?)source;

            Validate(request)
                .Should()
                .ContainSingle()
                .Which.MemberNames.Should()
                .Contain(nameof(RecordCookieConsentRequestDto.Source));
        }

        [Fact]
        public void Validation_TextVersionLongerThan32Chars_IsRejected()
        {
            var request = ValidRequest();
            request.TextVersion = new string('x', 33);

            Validate(request)
                .Should()
                .ContainSingle()
                .Which.MemberNames.Should()
                .Contain(nameof(RecordCookieConsentRequestDto.TextVersion));
        }

        // ---------- Service ----------

        [Theory]
        [InlineData(UserId, UserId)]
        [InlineData(null, null)]
        [InlineData("", null)]
        [InlineData("   ", null)]
        public async Task Service_AppendsRecord_WithUserIdOnlyForLoggedInUser(
            string? userId,
            string? expectedUserId
        )
        {
            var repository = new Mock<ILegalRepository>();
            CookieConsentRecord? saved = null;
            repository
                .Setup(r => r.AddCookieConsentRecordAsync(It.IsAny<CookieConsentRecord>()))
                .Callback<CookieConsentRecord>(r => saved = r)
                .Returns(Task.CompletedTask);
            var before = DateTime.UtcNow;

            await new LegalService(repository.Object).RecordCookieConsentAsync(
                ValidRequest(),
                userId
            );

            saved.Should().NotBeNull();
            saved!.Id.Should().NotBe(Guid.Empty);
            saved.ConsentId.Should().Be(ConsentId);
            saved.UserId.Should().Be(expectedUserId);
            saved.AnalyticsGranted.Should().BeTrue();
            saved.AdsGranted.Should().BeFalse();
            saved.Source.Should().Be(CookieConsentSource.Banner);
            saved.TextVersion.Should().Be("2026-11-13");
            saved.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(DateTime.UtcNow);
            saved.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
        }

        [Fact]
        public async Task Service_EveryDecision_CreatesNewRecord_NeverUpdates()
        {
            var repository = new Mock<ILegalRepository>();
            var saved = new List<CookieConsentRecord>();
            repository
                .Setup(r => r.AddCookieConsentRecordAsync(It.IsAny<CookieConsentRecord>()))
                .Callback<CookieConsentRecord>(saved.Add)
                .Returns(Task.CompletedTask);
            var sut = new LegalService(repository.Object);

            var withdrawal = ValidRequest();
            withdrawal.AnalyticsGranted = false;
            withdrawal.Source = CookieConsentSource.Preferences;

            await sut.RecordCookieConsentAsync(ValidRequest(), null);
            await sut.RecordCookieConsentAsync(withdrawal, null);

            saved.Should().HaveCount(2);
            saved.Select(r => r.Id).Should().OnlyHaveUniqueItems();
            saved[1].AnalyticsGranted.Should().BeFalse();
            saved[1].Source.Should().Be(CookieConsentSource.Preferences);
        }

        // ---------- Controller ----------

        private static (LegalController Controller, Mock<ILegalService> Service) CreateController()
        {
            var service = new Mock<ILegalService>();
            var controller = new LegalController(
                service.Object,
                IdentityMocks.UserManager().Object,
                Mock.Of<ITokenService>(),
                Mock.Of<IClientInfoProvider>(),
                NullLogger<LegalController>.Instance
            );
            return (controller, service);
        }

        [Fact]
        public async Task Controller_LoggedInUser_PassesUserIdAndReturns204()
        {
            var (controller, service) = CreateController();
            controller.WithUser(UserId);
            var request = ValidRequest();

            var result = await controller.RecordCookieConsent(request);

            result.Should().BeOfType<NoContentResult>();
            service.Verify(s => s.RecordCookieConsentAsync(request, UserId), Times.Once);
        }

        [Fact]
        public async Task Controller_AnonymousVisitor_RecordsWithoutUserId()
        {
            var (controller, service) = CreateController();
            controller.WithoutUser();
            var request = ValidRequest();

            var result = await controller.RecordCookieConsent(request);

            result.Should().BeOfType<NoContentResult>();
            service.Verify(s => s.RecordCookieConsentAsync(request, null), Times.Once);
        }
    }
}
