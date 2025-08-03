using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    public class ServiceCostRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly ServiceCostRepository _repository;

        public ServiceCostRepositoryTests()
        {
            // Arrange - tworzymy bazę danych w pamięci dla każdego testu
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new ServiceCostRepository(_context);

            // Dodajemy dane testowe
            SeedTestData();
        }

        private void SeedTestData()
        {
            _context.ServiceCosts.AddRange(
                new ServiceCost
                {
                    Id = 1,
                    ServiceName = "AnalyzeProfile",
                    TokenCost = 5,
                },
                new ServiceCost
                {
                    Id = 2,
                    ServiceName = "GenerateCV",
                    TokenCost = 10,
                }
            );
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetServiceCostAsync_WhenServiceExists_ReturnsCorrectCost()
        {
            // Act
            var result = await _repository.GetServiceCostAsync("AnalyzeProfile");

            // Assert
            result.Should().Be(5);
        }

        [Fact]
        public async Task GetServiceCostAsync_WhenServiceDoesNotExist_ThrowsKeyNotFoundException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _repository.GetServiceCostAsync("NonExistentService")
            );
        }

        [Theory] // Theory pozwala testować różne przypadki
        [InlineData("")]
        [InlineData(" ")]
        [InlineData(null)]
        public async Task GetServiceCostAsync_WhenServiceNameIsInvalid_ThrowsArgumentException(
            string serviceName
        )
        {
            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.GetServiceCostAsync(serviceName)
            );

            exception.ParamName.Should().Be("serviceName");
        }

        [Fact]
        public async Task GetServiceCostAsync_IsCaseInsensitive()
        {
            // Act - testujemy różne wielkości liter
            var result1 = await _repository.GetServiceCostAsync("analyzeprofile");
            var result2 = await _repository.GetServiceCostAsync("ANALYZEPROFILE");
            var result3 = await _repository.GetServiceCostAsync("AnalyzeProfile");

            // Assert - wszystkie powinny zwrócić ten sam wynik
            result1.Should().Be(5);
            result2.Should().Be(5);
            result3.Should().Be(5);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
