using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.Legal.Services
{
    /// <summary>
    /// Tests of the legal document version rule: a new version binds existing users only
    /// from ValidFrom, while new users accept it right away.
    /// </summary>
    public sealed class LegalServiceTests
    {
        private const string UserId = "user-test-123";

        private static readonly LegalDocument PreviousTerms = Terms(
            "2025-12-22",
            DateTime.UtcNow.AddMonths(-10)
        );

        private readonly Mock<ILegalRepository> _repository = new();
        private readonly LegalService _sut;

        public LegalServiceTests()
        {
            _sut = new LegalService(_repository.Object);
        }

        private static LegalDocument Terms(string version, DateTime validFrom) =>
            new()
            {
                Id = Guid.NewGuid(),
                Type = LegalDocumentType.TermsOfService,
                Version = version,
                ContentPath = "/terms-of-service/pdf",
                IsActive = true,
                ValidFrom = validFrom,
            };

        private void Setup(IEnumerable<LegalDocument> activeDocuments, params Guid[] acceptedIds)
        {
            _repository
                .Setup(r => r.GetActiveDocumentsAsync())
                .ReturnsAsync(activeDocuments.ToList());
            _repository
                .Setup(r => r.GetAcceptedDocumentIdsAsync(UserId))
                .ReturnsAsync(acceptedIds.ToList());
        }

        [Fact]
        public async Task ExistingUser_BeforeNewVersionTakesEffect_IsNotBlocked()
        {
            var upcoming = Terms("2026-10-13", DateTime.UtcNow.AddDays(14));
            Setup([PreviousTerms, upcoming], PreviousTerms.Id);

            (await _sut.HasValidConsentsAsync(UserId)).Should().BeTrue();
            (await _sut.GetPendingDocumentsAsync(UserId)).Should().BeEmpty();
        }

        [Fact]
        public async Task ExistingUser_AfterNewVersionTakesEffect_MustAcceptNewVersion()
        {
            var current = Terms("2026-10-13", DateTime.UtcNow.AddDays(-1));
            Setup([PreviousTerms, current], PreviousTerms.Id);

            (await _sut.HasValidConsentsAsync(UserId)).Should().BeFalse();
            (await _sut.GetPendingDocumentsAsync(UserId))
                .Should()
                .ContainSingle()
                .Which.Id.Should()
                .Be(current.Id);
        }

        [Fact]
        public async Task UserWhoAcceptedUpcomingVersion_IsNotBlockedBeforeOrAfterItTakesEffect()
        {
            var upcoming = Terms("2026-10-13", DateTime.UtcNow.AddDays(14));
            Setup([PreviousTerms, upcoming], upcoming.Id);
            (await _sut.HasValidConsentsAsync(UserId)).Should().BeTrue();

            var current = Terms("2026-10-13", DateTime.UtcNow.AddDays(-1));
            Setup([PreviousTerms, current], current.Id);
            (await _sut.HasValidConsentsAsync(UserId)).Should().BeTrue();
        }

        [Fact]
        public async Task UserWithoutConsents_MustAcceptNewestVersion_EvenBeforeItTakesEffect()
        {
            var upcoming = Terms("2026-10-13", DateTime.UtcNow.AddDays(14));
            Setup([PreviousTerms, upcoming]);

            (await _sut.HasValidConsentsAsync(UserId)).Should().BeFalse();
            (await _sut.GetPendingDocumentsAsync(UserId))
                .Should()
                .ContainSingle()
                .Which.Id.Should()
                .Be(upcoming.Id);
        }

        [Fact]
        public async Task GetCurrentDocumentIds_ReturnsNewestVersionPerType()
        {
            var upcoming = Terms("2026-10-13", DateTime.UtcNow.AddDays(14));
            Setup([PreviousTerms, upcoming]);

            (await _sut.GetCurrentDocumentIdsAsync()).Should().Equal(upcoming.Id);
        }

        [Fact]
        public async Task NoActiveDocuments_UserIsNotBlocked()
        {
            Setup([]);

            (await _sut.HasValidConsentsAsync(UserId)).Should().BeTrue();
        }
    }
}
