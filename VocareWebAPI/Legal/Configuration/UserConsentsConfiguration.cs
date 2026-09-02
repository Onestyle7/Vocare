using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocareWebAPI.Legal.Models.Entities;

namespace VocareWebAPI.Legal.Configuration
{
    public class UserConsentEntityTypeConfiguration : IEntityTypeConfiguration<UserConsent>
    {
        public void Configure(EntityTypeBuilder<UserConsent> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.AcceptedAt)
                .IsRequired();
            builder.Property(e => e.IpAddress)
                .IsRequired()
                .HasMaxLength(50);
            builder.Property(e => e.UserAgent)
                .IsRequired()
                .HasMaxLength(1000);
            builder.Property(e => e.ConsentSource)
                .HasConversion<string>()
                .HasMaxLength(100)
                .IsRequired();

            builder
                .HasIndex(e => new { e.UserId, e.LegalDocumentId })
                .IsUnique();

            // Relations
            builder
                .HasOne(uc => uc.LegalDocument)
                .WithMany(ld => ld.UserConsents)
                .HasForeignKey(uc => uc.LegalDocumentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(uc => uc.User)
                .WithMany(u => u.UserConsents)
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
