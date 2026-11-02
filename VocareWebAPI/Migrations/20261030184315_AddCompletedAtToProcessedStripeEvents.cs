using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedAtToProcessedStripeEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                schema: "public",
                table: "ProcessedStripeEvents",
                type: "timestamp with time zone",
                nullable: true
            );

            // Eventy zapisane przed wdrożeniem zostały obsłużone w całości – bez tego wyglądałyby
            // na porzucone rezerwacje i ponowienie od Stripe mogłoby obsłużyć je drugi raz
            migrationBuilder.Sql(
                """
                UPDATE public."ProcessedStripeEvents"
                SET "CompletedAt" = "ProcessedAt"
                WHERE "CompletedAt" IS NULL;
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                schema: "public",
                table: "ProcessedStripeEvents"
            );
        }
    }
}
