using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketAnalysisEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CareerStatistics",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerName = table.Column<string>(type: "text", nullable: false),
                    AverageSalary = table.Column<decimal>(type: "numeric", nullable: false),
                    EmploymentRate = table.Column<int>(type: "integer", nullable: false),
                    GrowthForecast = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CareerStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketTrends",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrendName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketTrends", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "Identity",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath",
                column: "CareerStatisticsId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPath_CareerStatistics_CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath",
                column: "CareerStatisticsId",
                principalSchema: "Identity",
                principalTable: "CareerStatistics",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerPath_CareerStatistics_CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath");

            migrationBuilder.DropTable(
                name: "CareerStatistics",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "MarketTrends",
                schema: "Identity");

            migrationBuilder.DropIndex(
                name: "IX_CareerPath_CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath");

            migrationBuilder.DropColumn(
                name: "CareerStatisticsId",
                schema: "Identity",
                table: "CareerPath");
        }
    }
}
