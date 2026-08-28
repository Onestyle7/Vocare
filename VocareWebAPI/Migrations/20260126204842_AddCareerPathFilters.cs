using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerPathFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AllowedJobCategories",
                schema: "public",
                table: "CareerPath",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SuggestedSeniority",
                schema: "public",
                table: "CareerPath",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowedJobCategories",
                schema: "public",
                table: "CareerPath");

            migrationBuilder.DropColumn(
                name: "SuggestedSeniority",
                schema: "public",
                table: "CareerPath");
        }
    }
}
