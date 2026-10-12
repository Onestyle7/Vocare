using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class SeedBaselineLegalDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Inserting active documents
            migrationBuilder.Sql(
                @"
                    INSERT INTO ""LegalDocuments"" (""Id"", ""Type"", ""Version"", ""ContentPath"", ""IsActive"", ""ValidFrom"", ""CreatedAt"")
                    VALUES
                        (gen_random_uuid(), 'TermsOfService', '1.0', '/legal/terms-v1.0.pdf', true, NOW(), NOW()),
                        (gen_random_uuid(), 'PrivacyPolicy', '1.0', '/legal/privacy-v1.0.pdf', true, NOW(), NOW())
                    ON CONFLICT (""Type"", ""Version"") DO NOTHING;
                "
            );

            // Assigning consents to active users (Backfill)
            migrationBuilder.Sql(
                @"
                    INSERT INTO ""UserConsents"" (""Id"", ""UserId"", ""LegalDocumentId"", ""AcceptedAt"", ""IpAddress"", ""UserAgent"", ""AuthSource"")
                    SELECT
                        gen_random_uuid(),
                        u.""Id"",
                        d.""Id"",
                        NOW(),
                        '127.0.0.1',
                        'System_Migration_Baseline',
                        'SystemMigration'
                    FROM ""AspNetUsers"" u
                    CROSS JOIN ""LegalDocuments"" d
                    WHERE d.""IsActive"" = true
                    ON CONFLICT (""UserId"", ""LegalDocumentId"") DO NOTHING;
                "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                    DELETE FROM ""UserConsents"" WHERE ""UserAgent"" = 'System_Migration_Baseline';
                    DELETE FROM ""LegalDocuments"" WHERE ""Version"" = '1.0';
                "
            );
        }
    }
}
