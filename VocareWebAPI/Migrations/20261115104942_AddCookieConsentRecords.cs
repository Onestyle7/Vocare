using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCookieConsentRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CookieConsentRecords",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    AnalyticsGranted = table.Column<bool>(type: "boolean", nullable: false),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TextVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AdsGranted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CookieConsentRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CookieConsentRecords_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CookieConsentRecords_ConsentId_CreatedAt",
                schema: "public",
                table: "CookieConsentRecords",
                columns: new[] { "ConsentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CookieConsentRecords_CreatedAt",
                schema: "public",
                table: "CookieConsentRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CookieConsentRecords_UserId",
                schema: "public",
                table: "CookieConsentRecords",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CookieConsentRecords",
                schema: "public");
        }
    }
}
