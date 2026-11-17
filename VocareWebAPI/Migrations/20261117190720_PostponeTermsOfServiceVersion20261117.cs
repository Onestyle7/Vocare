using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <summary>
    /// The terms version added by AddTermsOfServiceVersion20261102 is published on 17.11.2026
    /// instead of 02.11.2026, so it binds existing users from 02.12.2026 instead of 17.11.2026
    /// (§ 18 sec. 2 – at least 14 days after the change notice email). A separate migration,
    /// because the earlier one may already have run in production.
    /// Dates must match TERMS_VERSION (frontend/features/marketing/constants/legal.ts)
    /// and termsOfService20261013Validity.
    /// </summary>
    public partial class PostponeTermsOfServiceVersion20261117 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Consents point at the row Id, so existing acceptances of this version stay valid
            migrationBuilder.Sql(
                @"
                    UPDATE ""LegalDocuments""
                    SET ""Version"" = '2026-11-17', ""ValidFrom"" = '2026-12-02T00:00:00+01:00'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-11-02';
                "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                    UPDATE ""LegalDocuments""
                    SET ""Version"" = '2026-11-02', ""ValidFrom"" = '2026-11-17T00:00:00+01:00'
                    WHERE ""Type"" = 'TermsOfService' AND ""Version"" = '2026-11-17';
                "
            );
        }
    }
}
