using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddBillingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceCosts",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ServiceName = table.Column<string>(type: "text", nullable: false),
                    TokenCost = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TokenTransactions",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenTransactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBillings",
                schema: "Identity",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TokenBalance = table.Column<int>(type: "integer", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "text", nullable: false),
                    StripeSubscriptionId = table.Column<string>(type: "text", nullable: false),
                    SubscriptionStatus = table.Column<int>(type: "integer", nullable: false),
                    SubscriptionLevel = table.Column<int>(type: "integer", nullable: false),
                    LastTokenPurchaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SubscriptionEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBillings", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserBillings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "Identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "Identity",
                table: "ServiceCosts",
                columns: new[] { "Id", "ServiceName", "TokenCost" },
                values: new object[,]
                {
                    { 1, "AnalyzeProfile", 5 },
                    { 2, "GenerateCV", 5 },
                    { 3, "MarketAnalysis", 5 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceCosts",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "TokenTransactions",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "UserBillings",
                schema: "Identity");
        }
    }
}
