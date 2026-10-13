using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocareWebAPI.Legal.Models.Entities;

namespace VocareWebAPI.Legal.Configuration
{
    public class LegalDocumentEntityTypeConfiguration : IEntityTypeConfiguration<LegalDocument>
    {
        public void Configure(EntityTypeBuilder<LegalDocument> builder)
        {
            builder
                .HasKey(e => e.Id);
            builder.Property(e => e.Version)
                .IsRequired()
                .HasMaxLength(20);
            builder.Property(e => e.ContentPath)
                .IsRequired()
                .HasMaxLength(255);
            builder.Property(e => e.Type)
                .HasConversion<string>()
                .IsRequired();
            builder.HasIndex(e => new { e.Type, e.Version })
                .IsUnique();
            builder.HasIndex(e => e.IsActive)
                .HasFilter("\"IsActive\" = true");
        }
    }
}
