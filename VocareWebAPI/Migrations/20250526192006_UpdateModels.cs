using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.RenameTable(
                name: "WorkExperienceEntry",
                schema: "Identity",
                newName: "WorkExperienceEntry",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "UserProfiles",
                schema: "Identity",
                newName: "UserProfiles",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "UserBillings",
                schema: "Identity",
                newName: "UserBillings",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "TokenTransactions",
                schema: "Identity",
                newName: "TokenTransactions",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "SwotAnalysis",
                schema: "Identity",
                newName: "SwotAnalysis",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "SkillDemand",
                schema: "Identity",
                newName: "SkillDemand",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "ServiceCosts",
                schema: "Identity",
                newName: "ServiceCosts",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "NextStep",
                schema: "Identity",
                newName: "NextStep",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "MarketTrends",
                schema: "Identity",
                newName: "MarketTrends",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "LanguageEntry",
                schema: "Identity",
                newName: "LanguageEntry",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "GeneratedCvs",
                schema: "Identity",
                newName: "GeneratedCvs",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "EducationEntry",
                schema: "Identity",
                newName: "EducationEntry",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "CertificateEntry",
                schema: "Identity",
                newName: "CertificateEntry",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "CareerStatistics",
                schema: "Identity",
                newName: "CareerStatistics",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "CareerPath",
                schema: "Identity",
                newName: "CareerPath",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetUserTokens",
                schema: "Identity",
                newName: "AspNetUserTokens",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetUsers",
                schema: "Identity",
                newName: "AspNetUsers",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetUserRoles",
                schema: "Identity",
                newName: "AspNetUserRoles",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetUserLogins",
                schema: "Identity",
                newName: "AspNetUserLogins",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetUserClaims",
                schema: "Identity",
                newName: "AspNetUserClaims",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetRoles",
                schema: "Identity",
                newName: "AspNetRoles",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AspNetRoleClaims",
                schema: "Identity",
                newName: "AspNetRoleClaims",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "AiRecommendations",
                schema: "Identity",
                newName: "AiRecommendations",
                newSchema: "public");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Identity");

            migrationBuilder.RenameTable(
                name: "WorkExperienceEntry",
                schema: "public",
                newName: "WorkExperienceEntry",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "UserProfiles",
                schema: "public",
                newName: "UserProfiles",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "UserBillings",
                schema: "public",
                newName: "UserBillings",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "TokenTransactions",
                schema: "public",
                newName: "TokenTransactions",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "SwotAnalysis",
                schema: "public",
                newName: "SwotAnalysis",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "SkillDemand",
                schema: "public",
                newName: "SkillDemand",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "ServiceCosts",
                schema: "public",
                newName: "ServiceCosts",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "NextStep",
                schema: "public",
                newName: "NextStep",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "MarketTrends",
                schema: "public",
                newName: "MarketTrends",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "LanguageEntry",
                schema: "public",
                newName: "LanguageEntry",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "GeneratedCvs",
                schema: "public",
                newName: "GeneratedCvs",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "EducationEntry",
                schema: "public",
                newName: "EducationEntry",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "CertificateEntry",
                schema: "public",
                newName: "CertificateEntry",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "CareerStatistics",
                schema: "public",
                newName: "CareerStatistics",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "CareerPath",
                schema: "public",
                newName: "CareerPath",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetUserTokens",
                schema: "public",
                newName: "AspNetUserTokens",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetUsers",
                schema: "public",
                newName: "AspNetUsers",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetUserRoles",
                schema: "public",
                newName: "AspNetUserRoles",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetUserLogins",
                schema: "public",
                newName: "AspNetUserLogins",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetUserClaims",
                schema: "public",
                newName: "AspNetUserClaims",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetRoles",
                schema: "public",
                newName: "AspNetRoles",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AspNetRoleClaims",
                schema: "public",
                newName: "AspNetRoleClaims",
                newSchema: "Identity");

            migrationBuilder.RenameTable(
                name: "AiRecommendations",
                schema: "public",
                newName: "AiRecommendations",
                newSchema: "Identity");
        }
    }
}
