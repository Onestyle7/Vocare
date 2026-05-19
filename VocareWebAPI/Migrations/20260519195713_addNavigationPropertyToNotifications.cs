using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class addNavigationPropertyToNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_AspNetUsers_UserId",
                schema: "public",
                table: "Notifications",
                column: "UserId",
                principalSchema: "public",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_AspNetUsers_UserId",
                schema: "public",
                table: "Notifications");
        }
    }
}
