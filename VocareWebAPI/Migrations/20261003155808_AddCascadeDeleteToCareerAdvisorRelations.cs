using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadeDeleteToCareerAdvisorRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerPaths_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_CareerPaths_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "NextStep");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPaths_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPaths",
                column: "AiRecommendationId",
                principalSchema: "public",
                principalTable: "AiRecommendations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPaths_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPaths",
                column: "CareerStatisticsId",
                principalSchema: "public",
                principalTable: "CareerStatistics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "NextStep",
                column: "AiRecommendationId",
                principalSchema: "public",
                principalTable: "AiRecommendations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerPaths_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_CareerPaths_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "NextStep");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPaths_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPaths",
                column: "AiRecommendationId",
                principalSchema: "public",
                principalTable: "AiRecommendations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPaths_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPaths",
                column: "CareerStatisticsId",
                principalSchema: "public",
                principalTable: "CareerStatistics",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "NextStep",
                column: "AiRecommendationId",
                principalSchema: "public",
                principalTable: "AiRecommendations",
                principalColumn: "Id");
        }
    }
}
