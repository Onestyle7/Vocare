using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixTimeHorizonTypo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerPath_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPath");

            migrationBuilder.DropForeignKey(
                name: "FK_CareerPath_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPath");

            migrationBuilder.DropForeignKey(
                name: "FK_CareerPath_SwotAnalysis_SwotAnalysisId",
                schema: "public",
                table: "CareerPath");

            migrationBuilder.DropForeignKey(
                name: "FK_Roadmaps_CareerPath_CareerPathId",
                schema: "public",
                table: "Roadmaps");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CareerPath",
                schema: "public",
                table: "CareerPath");

            migrationBuilder.RenameTable(
                name: "CareerPath",
                schema: "public",
                newName: "CareerPaths",
                newSchema: "public");

            migrationBuilder.RenameColumn(
                name: "TimeHorizontMonths",
                schema: "public",
                table: "Roadmaps",
                newName: "TimeHorizonMonths");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPath_SwotAnalysisId",
                schema: "public",
                table: "CareerPaths",
                newName: "IX_CareerPaths_SwotAnalysisId");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPath_CareerStatisticsId",
                schema: "public",
                table: "CareerPaths",
                newName: "IX_CareerPaths_CareerStatisticsId");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPath_AiRecommendationId",
                schema: "public",
                table: "CareerPaths",
                newName: "IX_CareerPaths_AiRecommendationId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CareerPaths",
                schema: "public",
                table: "CareerPaths",
                column: "Id");

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
                name: "FK_CareerPaths_SwotAnalysis_SwotAnalysisId",
                schema: "public",
                table: "CareerPaths",
                column: "SwotAnalysisId",
                principalSchema: "public",
                principalTable: "SwotAnalysis",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Roadmaps_CareerPaths_CareerPathId",
                schema: "public",
                table: "Roadmaps",
                column: "CareerPathId",
                principalSchema: "public",
                principalTable: "CareerPaths",
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
                name: "FK_CareerPaths_SwotAnalysis_SwotAnalysisId",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_Roadmaps_CareerPaths_CareerPathId",
                schema: "public",
                table: "Roadmaps");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CareerPaths",
                schema: "public",
                table: "CareerPaths");

            migrationBuilder.RenameTable(
                name: "CareerPaths",
                schema: "public",
                newName: "CareerPath",
                newSchema: "public");

            migrationBuilder.RenameColumn(
                name: "TimeHorizonMonths",
                schema: "public",
                table: "Roadmaps",
                newName: "TimeHorizontMonths");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPaths_SwotAnalysisId",
                schema: "public",
                table: "CareerPath",
                newName: "IX_CareerPath_SwotAnalysisId");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPaths_CareerStatisticsId",
                schema: "public",
                table: "CareerPath",
                newName: "IX_CareerPath_CareerStatisticsId");

            migrationBuilder.RenameIndex(
                name: "IX_CareerPaths_AiRecommendationId",
                schema: "public",
                table: "CareerPath",
                newName: "IX_CareerPath_AiRecommendationId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CareerPath",
                schema: "public",
                table: "CareerPath",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPath_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "CareerPath",
                column: "AiRecommendationId",
                principalSchema: "public",
                principalTable: "AiRecommendations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPath_CareerStatistics_CareerStatisticsId",
                schema: "public",
                table: "CareerPath",
                column: "CareerStatisticsId",
                principalSchema: "public",
                principalTable: "CareerStatistics",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerPath_SwotAnalysis_SwotAnalysisId",
                schema: "public",
                table: "CareerPath",
                column: "SwotAnalysisId",
                principalSchema: "public",
                principalTable: "SwotAnalysis",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Roadmaps_CareerPath_CareerPathId",
                schema: "public",
                table: "Roadmaps",
                column: "CareerPathId",
                principalSchema: "public",
                principalTable: "CareerPath",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
