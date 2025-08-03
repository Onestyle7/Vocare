using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Data;
using Xunit;

namespace VocareWebApi.Tests.Billing.Repositories
{
    public class ServiceCostRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly ServiceCostRepository _repository;

        public ServiceCostRepositoryTests()
        {
            // Arrange - tworzymy bazę danych w pamięci dla każdego testu
            // Każdy test dostaje swoją własną instancję bazy danych
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
            // Przygotowanie danych testowych
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
                },
                new ServiceCost
                {
                    Id = 3,
                    ServiceName = "MarketAnalysis",
                    TokenCost = 15,
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
            var action = async () => await _repository.GetServiceCostAsync("NonExistentService");

            await action
                .Should()
                .ThrowAsync<KeyNotFoundException>()
                .WithMessage("Service cost for \"NonExistentService\" not found.");
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("   ")]
        public async Task GetServiceCostAsync_WhenServiceNameIsInvalid_ThrowsArgumentException(
            string serviceName
        )
        {
            // Act & Assert
            var action = async () => await _repository.GetServiceCostAsync(serviceName);

            var exception = await action
                .Should()
                .ThrowAsync<ArgumentException>()
                .WithMessage("Service name cannot be null or empty.*");

            exception.And.ParamName.Should().Be("serviceName");
        }

        [Fact]
        public async Task GetServiceCostAsync_WhenServiceNameIsNull_ThrowsArgumentException()
        {
            // Act & Assert
            var action = async () => await _repository.GetServiceCostAsync(null!);

            var exception = await action
                .Should()
                .ThrowAsync<ArgumentException>()
                .WithMessage("Service name cannot be null or empty.*");

            exception.And.ParamName.Should().Be("serviceName");
        }

        [Fact]
        public async Task GetServiceCostAsync_IsCaseInsensitive_WorksWithInMemory()
        {
            // Arrange & Act - testujemy różne warianty wielkości liter
            var result1 = await _repository.GetServiceCostAsync("AnalyzeProfile");
            var result2 = await _repository.GetServiceCostAsync("analyzeprofile");
            var result3 = await _repository.GetServiceCostAsync("ANALYZEPROFILE");
            var result4 = await _repository.GetServiceCostAsync("AnalyzePROFILE");

            // Assert - wszystkie warianty powinny zwrócić ten sam wynik
            result1.Should().Be(5);
            result2.Should().Be(5);
            result3.Should().Be(5);
            result4.Should().Be(5);
        }

        [Fact]
        public async Task GetServiceCostAsync_MultipleServices_ReturnsCorrectCosts()
        {
            // Act & Assert - testujemy wszystkie seedowane serwisy
            var analyzeProfileCost = await _repository.GetServiceCostAsync("AnalyzeProfile");
            analyzeProfileCost.Should().Be(5);

            var generateCVCost = await _repository.GetServiceCostAsync("GenerateCV");
            generateCVCost.Should().Be(10);

            var marketAnalysisCost = await _repository.GetServiceCostAsync("MarketAnalysis");
            marketAnalysisCost.Should().Be(15);
        }

        [Fact]
        public async Task GetServiceCostAsync_ConcurrentCalls_HandlesCorrectly()
        {
            // Arrange
            var tasks = new List<Task<int>>();

            // Act - symulujemy równoczesne wywołania
            for (int i = 0; i < 10; i++)
            {
                tasks.Add(_repository.GetServiceCostAsync("AnalyzeProfile"));
            }

            var results = await Task.WhenAll(tasks);

            // Assert - wszystkie wywołania powinny zwrócić ten sam wynik
            results.Should().AllBeEquivalentTo(5);
        }

        [Fact]
        public async Task Repository_UsesCorrectDbContext()
        {
            // Arrange
            var newService = new ServiceCost
            {
                Id = 99,
                ServiceName = "TestService",
                TokenCost = 25,
            };

            // Act - dodajemy nowy serwis bezpośrednio do kontekstu
            _context.ServiceCosts.Add(newService);
            await _context.SaveChangesAsync();

            // Assert - repozytorium powinno zobaczyć nowy serwis
            var result = await _repository.GetServiceCostAsync("TestService");
            result.Should().Be(25);
        }

        public void Dispose()
        {
            // Cleanup - zwalniamy zasoby kontekstu bazy danych
            _context?.Dispose();
        }
    }
}
