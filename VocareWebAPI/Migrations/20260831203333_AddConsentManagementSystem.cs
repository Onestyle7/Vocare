using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddConsentManagementSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LegalDocuments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ContentPath = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserConsents",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LegalDocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    AuthSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserConsents_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserConsents_LegalDocuments_LegalDocumentId",
                        column: x => x.LegalDocumentId,
                        principalSchema: "public",
                        principalTable: "LegalDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LegalDocuments_IsActive",
                schema: "public",
                table: "LegalDocuments",
                column: "IsActive",
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_LegalDocuments_Type_Version",
                schema: "public",
                table: "LegalDocuments",
                columns: new[] { "Type", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserConsents_LegalDocumentId",
                schema: "public",
                table: "UserConsents",
                column: "LegalDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserConsents_UserId_LegalDocumentId",
                schema: "public",
                table: "UserConsents",
                columns: new[] { "UserId", "LegalDocumentId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserConsents",
                schema: "public");

            migrationBuilder.DropTable(
                name: "LegalDocuments",
                schema: "public");
        }
    }
}
