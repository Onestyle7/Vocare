using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <summary>
    /// Legal document versions matching the content served by the frontend.
    /// Dates must match TERMS_VERSION (frontend/features/marketing/constants/legal.ts)
    /// and termsOfService20251222Validity – if the deployment moves, update them in all places.
    /// </summary>
    public partial class UpdateLegalDocumentVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The backfilled baseline is the terms of 22.12.2025, accepted by existing users
            migrationBuilder.Sql(
                @"
                    UPDATE ""LegalDocuments""
                    SET ""Version"" = '2025-12-22',
                        ""ContentPath"" = '/terms-of-service/2025-12-22/pdf',
                        ""ValidFrom"" = '2025-12-22T00:00:00+01:00'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '1.0';
                "
            );

            // New terms: new users accept them from deployment, existing users are bound
            // from ValidFrom (§ 18 sec. 2 – at least 14 days after the change notice email)
            migrationBuilder.Sql(
                @"
                    INSERT INTO ""LegalDocuments"" (""Id"", ""Type"", ""Version"", ""ContentPath"", ""IsActive"", ""ValidFrom"", ""CreatedAt"")
                    VALUES (gen_random_uuid(), 'TermsOfService', '2026-10-13', '/terms-of-service/pdf', true, '2026-10-28T00:00:00+01:00', NOW())
                    ON CONFLICT (""Type"", ""Version"") DO NOTHING;
                "
            );

            // The privacy policy is informational (GDPR art. 13) – it is not subject to acceptance
            migrationBuilder.Sql(
                @"
                    DELETE FROM ""UserConsents""
                    WHERE ""LegalDocumentId"" IN (SELECT ""Id"" FROM ""LegalDocuments"" WHERE ""Type"" = 'PrivacyPolicy');
                    DELETE FROM ""LegalDocuments"" WHERE ""Type"" = 'PrivacyPolicy';
                "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The privacy policy is not restored – it was a placeholder with no evidential value
            migrationBuilder.Sql(
                @"
                    DELETE FROM ""UserConsents""
                    WHERE ""LegalDocumentId"" IN (
                        SELECT ""Id"" FROM ""LegalDocuments"" WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-10-13'
                    );
                    DELETE FROM ""LegalDocuments"" WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-10-13';
                    UPDATE ""LegalDocuments""
                    SET ""Version"" = '1.0', ""ContentPath"" = '/legal/terms-v1.0.pdf'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2025-12-22';
                "
            );
        }
    }
}
