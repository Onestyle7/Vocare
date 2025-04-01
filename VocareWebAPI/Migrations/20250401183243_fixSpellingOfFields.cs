using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class fixSpellingOfFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PrimatyPath",
                schema: "Identity",
                table: "AiRecommendations",
                newName: "PrimaryPath");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PrimaryPath",
                schema: "Identity",
                table: "AiRecommendations",
                newName: "PrimatyPath");
        }
    }
}
