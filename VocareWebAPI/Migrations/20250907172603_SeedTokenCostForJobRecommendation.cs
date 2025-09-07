using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class SeedTokenCostForJobRecommendation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "public",
                table: "ServiceCosts",
                columns: new[] { "Id", "ServiceName", "TokenCost" },
                values: new object[] { 5, "JobRecommendation", 3 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 5);
        }
    }
}
