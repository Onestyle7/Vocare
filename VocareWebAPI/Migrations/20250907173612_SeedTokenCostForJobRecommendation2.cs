using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class SeedTokenCostForJobRecommendation2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 5,
                column: "ServiceName",
                value: "JobRecommendations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 5,
                column: "ServiceName",
                value: "JobRecommendation");
        }
    }
}
