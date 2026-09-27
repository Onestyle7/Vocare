using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueWelcomeBonusIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TokenTransactions_UserId_WelcomeBonus",
                schema: "public",
                table: "TokenTransactions",
                column: "UserId",
                unique: true,
                filter: "\"Type\" = 2"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TokenTransactions_UserId_WelcomeBonus",
                schema: "public",
                table: "TokenTransactions"
            );
        }
    }
}
