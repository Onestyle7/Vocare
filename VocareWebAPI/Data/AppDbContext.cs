using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Data
{
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<UserProfile> UserProfiles { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("Identity");

            builder
                .Entity<User>()
                .HasOne(u => u.UserProfile) // User ma jeden profil
                .WithOne(u => u.User) // Profil ma jednego usera
                .HasForeignKey<UserProfile>(u => u.UserId);
        }
    }
}
