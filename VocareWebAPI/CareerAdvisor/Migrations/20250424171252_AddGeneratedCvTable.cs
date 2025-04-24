using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGeneratedCvTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Insititution",
                schema: "Identity",
                table: "EducationEntry",
                newName: "Institution");

            migrationBuilder.CreateTable(
                name: "GeneratedCvs",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<string>(type: "text", nullable: true),
                    CvJson = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    RawApiResponse = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeneratedCvs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeneratedCvs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "Identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "Identity",
                table: "ServiceCosts",
                columns: new[] { "Id", "ServiceName", "TokenCost" },
                values: new object[] { 4, "GenerateCv", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedCvs_UserId",
                schema: "Identity",
                table: "GeneratedCvs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GeneratedCvs",
                schema: "Identity");

            migrationBuilder.DeleteData(
                schema: "Identity",
                table: "ServiceCosts",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.RenameColumn(
                name: "Institution",
                schema: "Identity",
                table: "EducationEntry",
                newName: "Insititution");
        }
    }
}
