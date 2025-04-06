using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketAnalysisEntitiesAndDtos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.AlterColumn<Guid>(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "SkillDemand",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillName = table.Column<string>(type: "text", nullable: false),
                    Industry = table.Column<string>(type: "text", nullable: false),
                    DemandLevel = table.Column<int>(type: "integer", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillDemand", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillDemand_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "Identity",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId1");

            migrationBuilder.CreateIndex(
                name: "IX_CareerStatistics_AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillDemand_AiRecommendationId",
                schema: "Identity",
                table: "SkillDemand",
                column: "AiRecommendationId");

            migrationBuilder.AddForeignKey(
                name: "FK_CareerStatistics_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics",
                column: "AiRecommendationId",
                principalSchema: "Identity",
                principalTable: "AiRecommendations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId",
                principalSchema: "Identity",
                principalTable: "AiRecommendations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId1",
                principalSchema: "Identity",
                principalTable: "AiRecommendations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CareerStatistics_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics");

            migrationBuilder.DropForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropTable(
                name: "SkillDemand",
                schema: "Identity");

            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropIndex(
                name: "IX_CareerStatistics_AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics");

            migrationBuilder.DropColumn(
                name: "AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropColumn(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "CareerStatistics");

            migrationBuilder.AlterColumn<Guid>(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId",
                principalSchema: "Identity",
                principalTable: "AiRecommendations",
                principalColumn: "Id");
        }
    }
}
