using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChangeServiceCosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 1,
                column: "TokenCost",
                value: 60);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 3,
                column: "TokenCost",
                value: 50);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 1,
                column: "TokenCost",
                value: 5);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 3,
                column: "TokenCost",
                value: 5);
        }
    }
}
