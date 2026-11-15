using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Legal.Configuration
{
    public class CookieConsentRecordConfiguration : IEntityTypeConfiguration<CookieConsentRecord>
    {
        public void Configure(EntityTypeBuilder<CookieConsentRecord> builder)
        {
            builder.Property(e => e.TextVersion).IsRequired().HasMaxLength(32);
            builder.Property(e => e.Source).HasConversion<string>().HasMaxLength(20).IsRequired();

            builder.HasIndex(e => new { e.ConsentId, e.CreatedAt });
            builder.HasIndex(e => e.UserId);
            builder.HasIndex(e => e.CreatedAt);

            builder
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
