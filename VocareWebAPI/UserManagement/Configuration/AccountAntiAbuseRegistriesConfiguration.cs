using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Configuration;

public class AccountAntiAbuseRegistryConfiguration : IEntityTypeConfiguration<AccountAntiAbuseRegistry>
{
    public void Configure(EntityTypeBuilder<AccountAntiAbuseRegistry> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.EmailHash).IsUnique();
    }
}
