using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAiRecommendationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRecommendationDate",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "LastRecommendationJson",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "RecommendedCareerPath",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.CreateTable(
                name: "AiRecommendations",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RecommendationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrimatyPath = table.Column<string>(type: "text", nullable: false),
                    Justification = table.Column<string>(type: "text", nullable: false),
                    LongTermGoal = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiRecommendations_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalSchema: "Identity",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SwotAnalysis",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Strengths = table.Column<List<string>>(type: "text[]", nullable: false),
                    Weaknesses = table.Column<List<string>>(type: "text[]", nullable: false),
                    Opportunities = table.Column<List<string>>(type: "text[]", nullable: false),
                    Threats = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SwotAnalysis", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NextStep",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Step = table.Column<string>(type: "text", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NextStep", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "Identity",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CareerPath",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Propability = table.Column<string>(type: "text", nullable: false),
                    RequiredSkills = table.Column<List<string>>(type: "text[]", nullable: false),
                    MarketAnalysis = table.Column<List<string>>(type: "text[]", nullable: false),
                    RecommendedCourses = table.Column<List<string>>(type: "text[]", nullable: false),
                    SwotAnalysisId = table.Column<Guid>(type: "uuid", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CareerPath", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CareerPath_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "Identity",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CareerPath_SwotAnalysis_SwotAnalysisId",
                        column: x => x.SwotAnalysisId,
                        principalSchema: "Identity",
                        principalTable: "SwotAnalysis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_UserId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_AiRecommendationId",
                schema: "Identity",
                table: "CareerPath",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_SwotAnalysisId",
                schema: "Identity",
                table: "CareerPath",
                column: "SwotAnalysisId");

            migrationBuilder.CreateIndex(
                name: "IX_NextStep_AiRecommendationId",
                schema: "Identity",
                table: "NextStep",
                column: "AiRecommendationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CareerPath",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "NextStep",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "SwotAnalysis",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "AiRecommendations",
                schema: "Identity");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRecommendationDate",
                schema: "Identity",
                table: "UserProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastRecommendationJson",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecommendedCareerPath",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
