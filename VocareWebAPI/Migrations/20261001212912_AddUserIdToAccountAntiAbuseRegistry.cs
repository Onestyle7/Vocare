using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToAccountAntiAbuseRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                schema: "public",
                table: "AccountAntiAbuseRegistries",
                type: "text",
                nullable: false,
                defaultValue: ""
            );

            migrationBuilder.CreateIndex(
                name: "IX_AccountAntiAbuseRegistries_UserId",
                schema: "public",
                table: "AccountAntiAbuseRegistries",
                column: "UserId"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AccountAntiAbuseRegistries_UserId",
                schema: "public",
                table: "AccountAntiAbuseRegistries"
            );

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "public",
                table: "AccountAntiAbuseRegistries"
            );
        }
    }
}
