using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateServiceCostsSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ServiceName", "TokenCost" },
                values: new object[] { "GenerateCvFromProfile", 20 });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "ServiceName", "TokenCost" },
                values: new object[] { "TailorCv", 20 });

            migrationBuilder.InsertData(
                schema: "public",
                table: "ServiceCosts",
                columns: new[] { "Id", "ServiceName", "TokenCost" },
                values: new object[] { 5, "AnalyzeCv", 10 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ServiceName", "TokenCost" },
                values: new object[] { "GenerateCV", 5 });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "ServiceName", "TokenCost" },
                values: new object[] { "GenerateCv", 1 });
        }
    }
}
