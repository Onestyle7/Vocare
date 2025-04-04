using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Data
{
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<AiRecommendation> AiRecommendations { get; set; }
        public DbSet<CareerStatistics> CareerStatistics { get; set; }
        public DbSet<MarketTrends> MarketTrends { get; set; }
        public DbSet<SkillDemand> SkillDemand { get; set; }

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
