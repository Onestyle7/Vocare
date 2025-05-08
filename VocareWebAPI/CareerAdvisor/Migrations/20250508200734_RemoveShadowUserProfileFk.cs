using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveShadowUserProfileFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AiRecommendations_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropForeignKey(
                name: "FK_MarketTrends_AiRecommendations_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropIndex(
                name: "IX_AiRecommendations_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropColumn(
                name: "AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends");

            migrationBuilder.DropColumn(
                name: "UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.AddColumn<Guid>(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "AiRecommendationId");

            migrationBuilder.AddForeignKey(
                name: "FK_AiRecommendations_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "AiRecommendationId",
                principalSchema: "Identity",
                principalTable: "AiRecommendations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AiRecommendations_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropIndex(
                name: "IX_AiRecommendations_AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropColumn(
                name: "AiRecommendationId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.AddColumn<Guid>(
                name: "AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_AiRecommendationId1",
                schema: "Identity",
                table: "MarketTrends",
                column: "AiRecommendationId1");

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "UserProfileUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AiRecommendations_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
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
    }
}
