using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class RenameAuthSourceConsentSourceAndConsentFileTypeToLegalDocumentType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AuthSource",
                schema: "public",
                table: "UserConsents",
                newName: "ConsentSource");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ConsentSource",
                schema: "public",
                table: "UserConsents",
                newName: "AuthSource");
        }
    }
}
