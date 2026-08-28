using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCvAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CvAnalyses",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CvId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResultJson = table.Column<string>(type: "text", nullable: false),
                    CvVersionAtAnalysis = table.Column<int>(type: "integer", nullable: false),
                    AnalyzedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CvAnalyses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CvAnalyses_GeneratedCvs_CvId",
                        column: x => x.CvId,
                        principalSchema: "public",
                        principalTable: "GeneratedCvs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CvAnalyses_CvId",
                schema: "public",
                table: "CvAnalyses",
                column: "CvId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CvAnalyses",
                schema: "public");
        }
    }
}
