using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.Integration
{
    /// <summary>
    /// Bazowa klasa dla testów integracyjnych
    /// Zapewnia wspólną konfigurację i pomocnicze metody
    /// </summary>
    public abstract class IntegrationTestBase
        : IClassFixture<TestWebApplicationFactory>,
            IDisposable
    {
        protected readonly TestWebApplicationFactory Factory;
        protected readonly HttpClient Client;
        protected readonly IServiceScope Scope;

        protected IntegrationTestBase(TestWebApplicationFactory factory)
        {
            Factory = factory;

            // Tworzenie klienta HTTP z właściwą konfiguracją
            Client = Factory
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Dodatkowa konfiguracja dla konkretnego testu może być dodana tutaj
                    });
                })
                .CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

            // Utworzenie scope dla dostępu do serwisów
            Scope = Factory.Services.CreateScope();
        }

        /// <summary>
        /// Pobiera serwis z kontenera DI
        /// </summary>
        protected T GetService<T>()
            where T : notnull
        {
            return Scope.ServiceProvider.GetRequiredService<T>();
        }

        /// <summary>
        /// Tworzy użytkownika testowego i zwraca token autoryzacji
        /// </summary>
        protected async Task<string> CreateAndAuthenticateTestUserAsync(
            string email = "test@example.com",
            string password = "Test123!"
        )
        {
            // Tworzenie użytkownika przez UserManager
            using var scope = Factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

            var user = new User
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                throw new Exception(
                    $"Failed to create test user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}"
                );
            }

            // Logowanie i pobranie tokenu
            return await GetAuthTokenAsync(email, password);
        }

        /// <summary>
        /// Pobiera token autoryzacji dla istniejącego użytkownika
        /// </summary>
        protected async Task<string> GetAuthTokenAsync(
            string email = "test@example.com",
            string password = "Test123!"
        )
        {
            var loginRequest = new LoginRequest
            {
                Email = email,
                Password = password,
                UseCookies = false,
                UseSessionCookies = false,
            };

            var response = await Client.PostAsJsonAsync("/login", loginRequest);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Login failed: {response.StatusCode} - {errorContent}");
            }

            // Dla Identity API, token może być w nagłówku Authorization lub w cookie
            // Sprawdzamy najpierw nagłówek
            if (response.Headers.TryGetValues("Authorization", out var authHeaders))
            {
                var bearerToken = authHeaders.FirstOrDefault()?.Replace("Bearer ", "");
                if (!string.IsNullOrEmpty(bearerToken))
                {
                    return bearerToken;
                }
            }

            // Jeśli nie ma w nagłówku, możemy sprawdzić cookies
            if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
            {
                var authCookie = cookies.FirstOrDefault(c =>
                    c.Contains(".AspNetCore.Identity.Application")
                );
                if (!string.IsNullOrEmpty(authCookie))
                {
                    // Dla cookie-based auth, zwracamy pusty string i używamy cookies
                    return "cookie-auth";
                }
            }

            // Alternatywnie, token może być w body odpowiedzi
            var content = await response.Content.ReadAsStringAsync();
            try
            {
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("accessToken", out var tokenElement))
                {
                    return tokenElement.GetString() ?? throw new Exception("Token is null");
                }
            }
            catch (JsonException)
            {
                // Jeśli nie możemy sparsować JSON, rzucamy wyjątek
            }

            throw new Exception($"Could not extract auth token from response. Response: {content}");
        }

        /// <summary>
        /// Ustawia nagłówek autoryzacji dla klienta HTTP
        /// </summary>
        protected void AuthorizeClient(string token)
        {
            if (token == "cookie-auth")
            {
                // Dla cookie-based auth nie musimy ustawiać nagłówka
                return;
            }

            Client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        /// <summary>
        /// Czyści bazę danych testową
        /// </summary>
        protected async Task ClearDatabaseAsync()
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Usuwamy dane w odpowiedniej kolejności ze względu na relacje
            context.TokenTransactions.RemoveRange(context.TokenTransactions);
            context.UserBillings.RemoveRange(context.UserBillings);
            context.GeneratedCvs.RemoveRange(context.GeneratedCvs);
            context.AiRecommendations.RemoveRange(context.AiRecommendations);
            context.UserProfiles.RemoveRange(context.UserProfiles);
            context.Users.RemoveRange(context.Users);

            await context.SaveChangesAsync();
        }

        /// <summary>
        /// Seeduje bazę danych danymi testowymi
        /// </summary>
        protected async Task SeedTestDataAsync()
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Możesz dodać tutaj dane testowe
            // np. ServiceCosts, domyślnych użytkowników itp.

            await context.SaveChangesAsync();
        }

        public virtual void Dispose()
        {
            Scope?.Dispose();
            Client?.Dispose();
        }
    }

    /// <summary>
    /// Fabryka aplikacji testowej z konfiguracją dla testów
    /// </summary>
    public class TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Usuń prawdziwą bazę danych
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                );

                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Dodaj testową bazę w pamięci
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
                });

                // Zastąp zewnętrzne serwisy mockami
                ReplaceExternalServices(services);

                // Buduj ServiceProvider
                var sp = services.BuildServiceProvider();

                // Utwórz scope i zainicjalizuj bazę danych
                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AppDbContext>();
                    var logger = scopedServices.GetRequiredService<
                        ILogger<TestWebApplicationFactory>
                    >();

                    try
                    {
                        db.Database.EnsureCreated();
                        SeedDatabase(db);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(
                            ex,
                            "An error occurred seeding the database with test data."
                        );
                        throw;
                    }
                }
            });

            builder.UseEnvironment("Testing");
        }

        private void ReplaceExternalServices(IServiceCollection services)
        {
            // Email Service Mock
            var emailServiceDescriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(IEmailService)
            );

            if (emailServiceDescriptor != null)
            {
                services.Remove(emailServiceDescriptor);
            }

            services.AddSingleton<IEmailService, MockEmailService>();

            // Możesz dodać więcej mocków dla zewnętrznych serwisów
        }

        private void SeedDatabase(AppDbContext context)
        {
            // Seedowanie podstawowych danych jeśli potrzebne
            // Na przykład ServiceCosts są już seedowane przez migracje EF
        }
    }

    /// <summary>
    /// Mock serwisu email dla testów
    /// </summary>
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendEmailAsync(string to, string subject, string body)
        {
            _logger.LogInformation($"Mock email sent to: {to}, subject: {subject}");
            return Task.CompletedTask;
        }
    }
}
