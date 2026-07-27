using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexReferenceNumberAndSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Source",
                schema: "public",
                table: "JobOffers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_JobOffers_ReferenceNumber_Source",
                schema: "public",
                table: "JobOffers",
                columns: new[] { "ReferenceNumber", "Source" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobOffers_ReferenceNumber_Source",
                schema: "public",
                table: "JobOffers");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "public",
                table: "JobOffers");
        }
    }
}
