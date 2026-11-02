using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialAndDiscountFlagsToAntiAbuseRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HadConsentDiscount",
                schema: "public",
                table: "AccountAntiAbuseRegistries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HadSubscription",
                schema: "public",
                table: "AccountAntiAbuseRegistries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Uzupełnienie dla kont usuniętych przed wdrożeniem – historia transakcji zostaje
            // po usunięciu konta (Type 0 = Purchase, 3 = ConsentDiscountGranted)
            migrationBuilder.Sql(
                """
                UPDATE public."AccountAntiAbuseRegistries" r
                SET "HadSubscription" = EXISTS (
                        SELECT 1 FROM public."TokenTransactions" t
                        WHERE t."UserId" = r."UserId"
                          AND t."Type" = 0
                          AND t."ServiceName" LIKE 'SubscriptionActivated-%'
                    ),
                    "HadConsentDiscount" = EXISTS (
                        SELECT 1 FROM public."TokenTransactions" t
                        WHERE t."UserId" = r."UserId" AND t."Type" = 3
                    );
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HadConsentDiscount",
                schema: "public",
                table: "AccountAntiAbuseRegistries");

            migrationBuilder.DropColumn(
                name: "HadSubscription",
                schema: "public",
                table: "AccountAntiAbuseRegistries");
        }
    }
}
