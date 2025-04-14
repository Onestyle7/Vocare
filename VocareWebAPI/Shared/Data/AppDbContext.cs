using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
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

        //Dodać tutaj XML
        public DbSet<UserBilling> UserBillings { get; set; }
        public DbSet<TokenTransaction> TokenTransactions { get; set; }
        public DbSet<ServiceCost> ServiceCosts { get; set; }

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

            //Relacja 1;1 miedz User a UserBilling
            builder
                .Entity<User>()
                .HasOne(u => u.Billing)
                .WithOne()
                .HasForeignKey<UserBilling>(ub => ub.UserId); // User ma jeden profil

            //Określenie klucza głównego dla UserBilling
            builder.Entity<UserBilling>().HasKey(ub => ub.UserId);

            //konfiguracja tokenTransaction
            builder.Entity<TokenTransaction>().HasKey(tt => tt.Id);

            //Konfiguracja ServiceCost
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

            //Seedowanie koszatów usług
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
                    }
                );
        }
    }
}
