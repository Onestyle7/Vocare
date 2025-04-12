using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Data
{
    /// <summary>
    /// Kontekst bazy danych aplikacji VocareWebAPI, obsługujący encje i relacje
    /// </summary>
    public class AppDbContext : IdentityDbContext<User>
    {
        /// <summary>
        /// Inicjalizuje nową instancję kontekstu bazy danych AppDbContext
        /// </summary>
        /// <param name="options">Opcje konfiguracyjne dla kontekstu bazy danych.</param>
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        /// <summary>
        /// Zbiór profili użytkowników w bazie danych
        /// </summary>
        public DbSet<UserProfile> UserProfiles { get; set; }

        /// <summary>
        /// Zbiór rekomendacji AI w bazie danych
        /// </summary>
        public DbSet<AiRecommendation> AiRecommendations { get; set; }

        /// <summary>
        /// Zbiór ścieżek kariery w bazie danych
        /// </summary>
        public DbSet<CareerStatistics> CareerStatistics { get; set; }

        /// <summary>
        /// Zbiór trendów rynkowych w bazie danych
        /// </summary>
        public DbSet<MarketTrends> MarketTrends { get; set; }

        /// <summary>
        /// Zbiór zapotrzebowania na umiejętności w bazie danych
        /// </summary>
        public DbSet<SkillDemand> SkillDemand { get; set; }

        /// <summary>
        /// Konfiguruje model bazy danych, definiując schemat i relacje między encjami
        /// </summary>
        /// <param name="builder"></param>

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("Identity");

            builder
                .Entity<User>()
                .HasOne(u => u.UserProfile) // User ma jeden profil
                .WithOne(u => u.User) // Profil ma jednego usera
                .HasForeignKey<UserProfile>(u => u.UserId);

            builder
                .Entity<AiRecommendation>()
                .HasMany(r => r.CareerStatistics)
                .WithOne()
                .HasForeignKey("AiRecommendationId");

            builder
                .Entity<AiRecommendation>()
                .HasMany(r => r.MarketTrends)
                .WithOne()
                .HasForeignKey("AiRecommendationId");

            builder
                .Entity<AiRecommendation>()
                .HasMany(r => r.SkillDemands)
                .WithOne()
                .HasForeignKey("AiRecommendationId");
        }
    }
}
