using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.CvGenerator.Models; // Poprawiony namespace
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Data
{
    /// <summary>
    /// Kontekst bazy danych aplikacji VocareWebAPI, obsługujący encje i relacje.
    /// </summary>
    public class AppDbContext : IdentityDbContext<User>
    {
        /// <summary>
        /// Inicjalizuje nową instancję kontekstu bazy danych AppDbContext.
        /// </summary>
        /// <param name="options">Opcje konfiguracyjne dla kontekstu bazy danych.</param>
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        /// <summary>
        /// Zbiór profili użytkowników w bazie danych.
        /// </summary>
        public DbSet<UserProfile> UserProfiles { get; set; }

        /// <summary>
        /// Zbiór rekomendacji AI w bazie danych.
        /// </summary>
        public DbSet<AiRecommendation> AiRecommendations { get; set; }

        /// <summary>
        /// Zbiór ścieżek kariery w bazie danych.
        /// </summary>
        public DbSet<CareerStatistics> CareerStatistics { get; set; }

        /// <summary>
        /// Zbiór trendów rynkowych w bazie danych.
        /// </summary>
        public DbSet<MarketTrends> MarketTrends { get; set; }

        /// <summary>
        /// Zbiór zapotrzebowania na umiejętności w bazie danych.
        /// </summary>
        public DbSet<SkillDemand> SkillDemand { get; set; }

        /// <summary>
        /// Zbiór danych rozliczeniowych użytkowników w bazie danych.
        /// </summary>
        public DbSet<UserBilling> UserBillings { get; set; }

        /// <summary>
        /// Zbiór transakcji tokenów w bazie danych.
        /// </summary>
        public DbSet<TokenTransaction> TokenTransactions { get; set; }

        /// <summary>
        /// Zbiór kosztów usług w bazie danych.
        /// </summary>
        public DbSet<ServiceCost> ServiceCosts { get; set; }

        /// <summary>
        /// Zbiór wygenerowanych CV w bazie danych.
        /// </summary>
        public DbSet<GeneratedCv> GeneratedCvs { get; set; }

        /// <summary>
        /// Konfiguruje model bazy danych, definiując schemat i relacje między encjami.
        /// </summary>
        /// <param name="builder">Builder modelu.</param>
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("Identity");

            builder
                .Entity<User>()
                .HasOne(u => u.UserProfile)
                .WithOne(u => u.User)
                .HasForeignKey<UserProfile>(u => u.UserId);

            // Relacja 1:1 między User a UserBilling
            builder
                .Entity<User>()
                .HasOne(u => u.Billing)
                .WithOne()
                .HasForeignKey<UserBilling>(ub => ub.UserId);

            // Klucz główny dla UserBilling
            builder.Entity<UserBilling>().HasKey(ub => ub.UserId);

            builder.Entity<UserBilling>().Property(ub => ub.StripeCustomerId).IsRequired(false);
            builder.Entity<UserBilling>().Property(ub => ub.StripeSubscriptionId).IsRequired(false);

            // Konfiguracja TokenTransaction
            builder.Entity<TokenTransaction>().HasKey(tt => tt.Id);

            // Konfiguracja ServiceCost
            builder.Entity<ServiceCost>().HasKey(sc => sc.Id);

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

            // Konfiguracja GeneratedCv
            builder.Entity<GeneratedCv>().HasKey(gc => gc.Id);
            builder.Entity<GeneratedCv>().Property(gc => gc.UserId).IsRequired();
            builder.Entity<GeneratedCv>().Property(gc => gc.CvJson).IsRequired().HasMaxLength(8000);
            builder
                .Entity<GeneratedCv>()
                .Property(gc => gc.RawApiResponse)
                .IsRequired()
                .HasMaxLength(8000);
            builder.Entity<GeneratedCv>().Property(gc => gc.GeneratedAt).IsRequired();

            // Relacja między GeneratedCv a User
            builder.Entity<GeneratedCv>().HasOne<User>().WithMany().HasForeignKey(gc => gc.UserId);

            // Seedowanie kosztów usług
            builder
                .Entity<ServiceCost>()
                .HasData(
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
                        TokenCost = 5,
                    },
                    new ServiceCost
                    {
                        Id = 3,
                        ServiceName = "MarketAnalysis",
                        TokenCost = 5,
                    },
                    new ServiceCost
                    {
                        Id = 4,
                        ServiceName = "GenerateCv",
                        TokenCost = 1,
                    }
                );
        }
    }
}
