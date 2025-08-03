using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace VocareWebApi.Tests.Integration
{
    public abstract class IntegrationTestBase : IClassFixture<TestWebApplicationFactory>
    {
        protected readonly TestWebApplicationFactory Factory;
        protected readonly HttpClient Client;
        protected readonly IServiceScope Scope;

        protected IntegrationTestBase(TestWebApplicationFactory factory)
        {
            Factory = factory;
            Client = Factory.CreateClient();
            Scope = Factory.Services.CreateScope();
        }

        protected T GetService<T>()
            where T : notnull
        {
            return Scope.ServiceProvider.GetRequiredService<T>();
        }

        protected async Task<string> GetAuthTokenAsync(
            string email = "test@example.com",
            string password = "Test123!"
        )
        {
            var loginRequest = new LoginRequest { Email = email, Password = password };

            var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            dynamic result = JsonSerializer.Deserialize<dynamic>(content)!;

            return result.token;
        }

        protected void AuthorizeClient(string token)
        {
            Client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }
    }

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
                    services.Remove(descriptor);

                // Dodaj testową bazę w pamięci
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });

                // Zastąp zewnętrzne serwisy mockami
                services.AddSingleton<IEmailService, MockEmailService>();
            });
        }
    }
}
