using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>Testy jednostkowe <see cref="JobOfferDetailsService"/>.</summary>
    public sealed class JobOfferDetailsServiceTests
    {
        private readonly Mock<IJobOfferRepository> _repository = new(MockBehavior.Strict);
        private readonly JobOfferDetailsService _sut;

        public JobOfferDetailsServiceTests()
        {
            _sut = new JobOfferDetailsService(_repository.Object);
        }

        [Fact]
        public async Task GetDetailsByIdAsync_WhenMissing_ThrowsJobOfferNotFound()
        {
            _repository
                .Setup(r => r.GetDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((JobOffer?)null);

            await _sut.Invoking(s => s.GetDetailsByIdAsync(Guid.NewGuid()))
                .Should()
                .ThrowAsync<JobOfferNotFoundException>();
        }

        [Fact]
        public async Task GetDetailsByIdAsync_MapsEntityToDtoWithSkillNames()
        {
            var id = Guid.NewGuid();
            _repository
                .Setup(r => r.GetDetailsByIdAsync(id))
                .ReturnsAsync(
                    new JobOffer
                    {
                        Id = id,
                        ReferenceNumber = "ref-1",
                        Title = "Backend Developer",
                        CompanyName = "Acme",
                        Country = "Poland",
                        Description = "Build APIs",
                        Category = "backend",
                        Skills = new List<JobOfferSkill>
                        {
                            new() { Name = "C#" },
                            new() { Name = "SQL" },
                        },
                    }
                );

            var dto = await _sut.GetDetailsByIdAsync(id);

            dto.Title.Should().Be("Backend Developer");
            dto.Country.Should().Be("Poland");
            dto.Skills.Should().BeEquivalentTo(new[] { "C#", "SQL" });
        }

        [Fact]
        public async Task GetDetailsByIdAsync_WhenCountryNull_MapsToEmptyString()
        {
            var id = Guid.NewGuid();
            _repository
                .Setup(r => r.GetDetailsByIdAsync(id))
                .ReturnsAsync(
                    new JobOffer
                    {
                        Id = id,
                        ReferenceNumber = "ref-1",
                        Country = null,
                        Skills = new List<JobOfferSkill>(),
                    }
                );

            (await _sut.GetDetailsByIdAsync(id)).Country.Should().BeEmpty();
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task GetDetailsByIdAsync_ExposesIsActive_SoClientCanFlagExpiredOffer(
            bool isActive
        )
        {
            var id = Guid.NewGuid();
            _repository
                .Setup(r => r.GetDetailsByIdAsync(id))
                .ReturnsAsync(
                    new JobOffer
                    {
                        Id = id,
                        ReferenceNumber = "ref-1",
                        IsActive = isActive,
                        DeactivatedAt = isActive ? null : DateTime.UtcNow,
                        Skills = new List<JobOfferSkill>(),
                    }
                );

            (await _sut.GetDetailsByIdAsync(id)).IsActive.Should().Be(isActive);
        }
    }
}
