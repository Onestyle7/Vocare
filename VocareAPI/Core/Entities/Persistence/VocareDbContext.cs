using System.Reflection.Emit;
using VocareAPI.Core.Entities;
using Microsoft.EntityFrameworkCore;


namespace VocareAPI.Core.Interfaces.Persistence
{
    public class VocareDbContext : DbContext
    {
        //ctor
        public VocareDbContext(DbContextOptions<VocareDbContext> options) : base(options)
        {
            
        }
        //DbSet dla encji
        public DbSet<User> Users { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<RecommendationHistory> RecommendationHistories { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //Konfiguracja relacji jeden do jeden
            modelBuilder.Entity<User>()
                .HasOne(u =>u.UserProfile)
                .WithOne(up => up.User)
                .HasForeignKey<UserProfile>(up => up.UserId);
        }
    }
    
}