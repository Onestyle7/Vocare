using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <summary>
    /// Terms version of 02.11.2026 (trial, quarterly plan, consent discount instead of welcome tokens).
    /// Dates must match TERMS_VERSION (frontend/features/marketing/constants/legal.ts)
    /// and termsOfService20261013Validity – if the deployment moves, update them in all places.
    /// The publication moved to 17.11.2026: PostponeTermsOfServiceVersion20261117 renames this
    /// version to 2026-11-17 and sets ValidFrom to 02.12.2026.
    /// </summary>
    public partial class AddTermsOfServiceVersion20261102 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The 13.10.2026 content no longer lives at /terms-of-service/pdf – point existing
            // consents at its frozen archive
            migrationBuilder.Sql(
                @"
                    UPDATE ""LegalDocuments""
                    SET ""ContentPath"" = '/terms-of-service/2026-10-13/pdf'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-10-13';
                "
            );

            // New terms: new users accept them from deployment, existing users are bound
            // from ValidFrom (§ 18 sec. 2 – at least 14 days after the change notice email)
            migrationBuilder.Sql(
                @"
                    INSERT INTO ""LegalDocuments"" (""Id"", ""Type"", ""Version"", ""ContentPath"", ""IsActive"", ""ValidFrom"", ""CreatedAt"")
                    VALUES (gen_random_uuid(), 'TermsOfService', '2026-11-02', '/terms-of-service/pdf', true, '2026-11-17T00:00:00+01:00', NOW())
                    ON CONFLICT (""Type"", ""Version"") DO UPDATE SET ""IsActive"" = true; -- re-apply after Down

                "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback deactivates the version instead of deleting it (Legal/README.md § 4) –
            // user consents to it are proof of acceptance (GDPR art. 7(1)) and must be kept
            migrationBuilder.Sql(
                @"
                    UPDATE ""LegalDocuments""
                    SET ""IsActive"" = false
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-11-02';
                    UPDATE ""LegalDocuments""
                    SET ""ContentPath"" = '/terms-of-service/pdf'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-10-13';
                "
            );
        }
    }
}
