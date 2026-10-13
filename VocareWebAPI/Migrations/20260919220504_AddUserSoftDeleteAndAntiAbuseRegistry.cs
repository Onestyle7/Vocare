using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSoftDeleteAndAntiAbuseRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                schema: "public",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                schema: "public",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AccountAntiAbuseRegistries",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmailHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HadWelcomeBonus = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountAntiAbuseRegistries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsDeleted",
                schema: "public",
                table: "AspNetUsers",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_AccountAntiAbuseRegistries_EmailHash",
                schema: "public",
                table: "AccountAntiAbuseRegistries",
                column: "EmailHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountAntiAbuseRegistries",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_IsDeleted",
                schema: "public",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                schema: "public",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                schema: "public",
                table: "AspNetUsers");
        }
    }
}
