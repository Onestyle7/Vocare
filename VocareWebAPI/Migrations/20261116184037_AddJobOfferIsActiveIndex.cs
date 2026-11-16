using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddJobOfferIsActiveIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_JobOffers_IsActive_DeactivatedAt",
                schema: "public",
                table: "JobOffers",
                columns: new[] { "IsActive", "DeactivatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobOffers_IsActive_DeactivatedAt",
                schema: "public",
                table: "JobOffers");
        }
    }
}
