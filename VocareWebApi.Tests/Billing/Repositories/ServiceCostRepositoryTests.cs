using System;
using System.Threading.Tasks;
using FluentAssertions;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Repositories
{
    /// <summary>Testy jednostkowe <see cref="ServiceCostRepository"/>.</summary>
    public sealed class ServiceCostRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly ServiceCostRepository _sut;

        public ServiceCostRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new ServiceCostRepository(_context);

            _context.ServiceCosts.Add(
                new ServiceCost
                {
                    Id = 500,
                    ServiceName = "CustomService",
                    TokenCost = 7,
                }
            );
            _context.SaveChanges();
        }

        public void Dispose() => _context.Dispose();

        [Fact]
        public async Task GetServiceCostAsync_ForKnownService_ReturnsConfiguredCost()
        {
            (await _sut.GetServiceCostAsync("CustomService")).Should().Be(7);
        }

        [Fact]
        public async Task GetServiceCostAsync_UsesSeededServiceCosts()
        {
            (await _sut.GetServiceCostAsync("AnalyzeProfile")).Should().Be(60);
        }

        [Theory]
        [InlineData("customservice")]
        [InlineData("CUSTOMSERVICE")]
        [InlineData("CustomSERVICE")]
        public async Task GetServiceCostAsync_IsCaseInsensitive(string serviceName)
        {
            (await _sut.GetServiceCostAsync(serviceName)).Should().Be(7);
        }

        [Fact]
        public async Task GetServiceCostAsync_ForUnknownService_ThrowsServiceCostNotFound()
        {
            await _sut.Invoking(r => r.GetServiceCostAsync("DoesNotExist"))
                .Should()
                .ThrowAsync<ServiceCostNotFoundException>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task GetServiceCostAsync_WithBlankName_ThrowsArgumentException(
            string? serviceName
        )
        {
            (
                await _sut.Invoking(r => r.GetServiceCostAsync(serviceName!))
                    .Should()
                    .ThrowAsync<ArgumentException>()
            )
                .Which.ParamName.Should()
                .Be("serviceName");
        }
    }
}
