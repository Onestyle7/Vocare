using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using VocareWebAPI.Data;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Tworzy odizolowane instancje <see cref="AppDbContext"/> oparte o dostawcę EF Core InMemory.
    /// Każde wywołanie <see cref="CreateContext"/> z tą samą nazwą bazy współdzieli dane,
    /// co pozwala zweryfikować, że zmiany faktycznie trafiły do bazy przez świeży kontekst.
    /// </summary>
    public static class TestDbContextFactory
    {
        /// <summary>
        /// Zwraca opcje wskazujące na unikalną bazę InMemory. Ostrzeżenia o ignorowanych
        /// transakcjach są wyciszone, ponieważ część serwisów produkcyjnych otwiera
        /// transakcje bezwarunkowo, a dostawca InMemory ich nie obsługuje.
        /// </summary>
        public static DbContextOptions<AppDbContext> CreateOptions(string? databaseName = null)
        {
            return new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .EnableSensitiveDataLogging()
                .Options;
        }

        /// <summary>
        /// Tworzy nowy kontekst bazy danych. Podanie <paramref name="databaseName"/> pozwala
        /// wielu kontekstom operować na wspólnym zestawie danych w obrębie jednego testu.
        /// </summary>
        public static AppDbContext CreateContext(string? databaseName = null)
        {
            var context = new TestAppDbContext(CreateOptions(databaseName));
            // Wymusza materializację modelu i wgranie danych zdefiniowanych przez HasData
            // (m.in. słownik ServiceCosts), tak jak w prawdziwej bazie po migracjach.
            context.Database.EnsureCreated();
            return context;
        }
    }
}
