using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddBackfillSkillEmbeddings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobOffferSkills_JobOffers_JobOfferId",
                schema: "public",
                table: "JobOffferSkills");

            migrationBuilder.DropPrimaryKey(
                name: "PK_JobOffferSkills",
                schema: "public",
                table: "JobOffferSkills");

            migrationBuilder.RenameTable(
                name: "JobOffferSkills",
                schema: "public",
                newName: "JobOfferSkills",
                newSchema: "public");

            migrationBuilder.RenameIndex(
                name: "IX_JobOffferSkills_Name",
                schema: "public",
                table: "JobOfferSkills",
                newName: "IX_JobOfferSkills_Name");

            migrationBuilder.RenameIndex(
                name: "IX_JobOffferSkills_JobOfferId",
                schema: "public",
                table: "JobOfferSkills",
                newName: "IX_JobOfferSkills_JobOfferId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_JobOfferSkills",
                schema: "public",
                table: "JobOfferSkills",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "SkillEmbeddings",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedSkillName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OriginalName = table.Column<string>(type: "text", nullable: false),
                    Embedding = table.Column<Vector>(type: "vector", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillEmbeddings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SkillEmbeddings_NormalizedSkillName",
                schema: "public",
                table: "SkillEmbeddings",
                column: "NormalizedSkillName",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_JobOfferSkills_JobOffers_JobOfferId",
                schema: "public",
                table: "JobOfferSkills",
                column: "JobOfferId",
                principalSchema: "public",
                principalTable: "JobOffers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobOfferSkills_JobOffers_JobOfferId",
                schema: "public",
                table: "JobOfferSkills");

            migrationBuilder.DropTable(
                name: "SkillEmbeddings",
                schema: "public");

            migrationBuilder.DropPrimaryKey(
                name: "PK_JobOfferSkills",
                schema: "public",
                table: "JobOfferSkills");

            migrationBuilder.RenameTable(
                name: "JobOfferSkills",
                schema: "public",
                newName: "JobOffferSkills",
                newSchema: "public");

            migrationBuilder.RenameIndex(
                name: "IX_JobOfferSkills_Name",
                schema: "public",
                table: "JobOffferSkills",
                newName: "IX_JobOffferSkills_Name");

            migrationBuilder.RenameIndex(
                name: "IX_JobOfferSkills_JobOfferId",
                schema: "public",
                table: "JobOffferSkills",
                newName: "IX_JobOffferSkills_JobOfferId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_JobOffferSkills",
                schema: "public",
                table: "JobOffferSkills",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_JobOffferSkills_JobOffers_JobOfferId",
                schema: "public",
                table: "JobOffferSkills",
                column: "JobOfferId",
                principalSchema: "public",
                principalTable: "JobOffers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
