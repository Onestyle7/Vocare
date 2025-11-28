using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class MarketAnalysisImprovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiNarrators",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SalaryInsight = table.Column<string>(type: "text", nullable: false),
                    WorkStyleInsight = table.Column<string>(type: "text", nullable: false),
                    EntryAdvice = table.Column<string>(type: "text", nullable: false),
                    MotivationalMessage = table.Column<string>(type: "text", nullable: false),
                    PersonalizedRecommendation = table.Column<string>(type: "text", nullable: false),
                    CareerStatisticsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiNarrators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiNarrators_CareerStatistics_CareerStatisticsId",
                        column: x => x.CareerStatisticsId,
                        principalSchema: "public",
                        principalTable: "CareerStatistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EntryDifficulties",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DifficultyScore = table.Column<int>(type: "integer", nullable: false),
                    DifficultyLevel = table.Column<string>(type: "text", nullable: false),
                    MissingSkillsCount = table.Column<int>(type: "integer", nullable: false),
                    MissingSkills = table.Column<string>(type: "text", nullable: false),
                    MatchingSkillsCount = table.Column<int>(type: "integer", nullable: false),
                    EstimatedTimeToReady = table.Column<string>(type: "text", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    CareerStatisticsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntryDifficulties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EntryDifficulties_CareerStatistics_CareerStatisticsId",
                        column: x => x.CareerStatisticsId,
                        principalSchema: "public",
                        principalTable: "CareerStatistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SalaryProgressions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerLevel = table.Column<string>(type: "text", nullable: false),
                    YearsOfExperience = table.Column<string>(type: "text", nullable: false),
                    MinSalary = table.Column<int>(type: "integer", nullable: false),
                    MaxSalary = table.Column<int>(type: "integer", nullable: false),
                    AverageSalary = table.Column<int>(type: "integer", nullable: false),
                    CareerStatisticsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryProgressions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalaryProgressions_CareerStatistics_CareerStatisticsId",
                        column: x => x.CareerStatisticsId,
                        principalSchema: "public",
                        principalTable: "CareerStatistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkAttributes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StressLevel = table.Column<int>(type: "integer", nullable: false),
                    AnalyticalThinking = table.Column<int>(type: "integer", nullable: false),
                    Creativity = table.Column<int>(type: "integer", nullable: false),
                    Teamwork = table.Column<int>(type: "integer", nullable: false),
                    Independence = table.Column<int>(type: "integer", nullable: false),
                    RoutineVsDynamic = table.Column<int>(type: "integer", nullable: false),
                    CustomerFacing = table.Column<int>(type: "integer", nullable: false),
                    TechnicalDepth = table.Column<int>(type: "integer", nullable: false),
                    CareerStatisticsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkAttributes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkAttributes_CareerStatistics_CareerStatisticsId",
                        column: x => x.CareerStatisticsId,
                        principalSchema: "public",
                        principalTable: "CareerStatistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiNarrators_CareerStatisticsId",
                schema: "public",
                table: "AiNarrators",
                column: "CareerStatisticsId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EntryDifficulties_CareerStatisticsId",
                schema: "public",
                table: "EntryDifficulties",
                column: "CareerStatisticsId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SalaryProgressions_CareerStatisticsId",
                schema: "public",
                table: "SalaryProgressions",
                column: "CareerStatisticsId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkAttributes_CareerStatisticsId",
                schema: "public",
                table: "WorkAttributes",
                column: "CareerStatisticsId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiNarrators",
                schema: "public");

            migrationBuilder.DropTable(
                name: "EntryDifficulties",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SalaryProgressions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "WorkAttributes",
                schema: "public");
        }
    }
}
