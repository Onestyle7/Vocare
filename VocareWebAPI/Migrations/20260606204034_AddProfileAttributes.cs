using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProfileAttributes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    PracticalExperience = table.Column<int>(type: "integer", nullable: false),
                    HardCompetencies = table.Column<int>(type: "integer", nullable: false),
                    Creativity = table.Column<int>(type: "integer", nullable: false),
                    Teamwork = table.Column<int>(type: "integer", nullable: false),
                    Independence = table.Column<int>(type: "integer", nullable: false),
                    SoftCompetencies = table.Column<int>(type: "integer", nullable: false),
                    Certification = table.Column<int>(type: "integer", nullable: false),
                    TechnicalSkills = table.Column<int>(type: "integer", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfileAttributes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfileAttributes_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProfileAttributes_UserId",
                schema: "public",
                table: "ProfileAttributes",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProfileAttributes",
                schema: "public");
        }
    }
}
