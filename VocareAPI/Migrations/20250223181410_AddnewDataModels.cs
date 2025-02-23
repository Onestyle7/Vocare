using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddnewDataModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Experience",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Goals",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Skills",
                table: "UserProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "Interests",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedSalary",
                table: "UserProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeeklyLearningAvailability",
                table: "UserProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkEnvironmentPreference",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ExperienceEntry",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Position = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Industry = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    YearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    Achievements = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserProfileId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExperienceEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExperienceEntry_UserProfiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "UserProfiles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SkillEntry",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Level = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserProfileId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillEntry_UserProfiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "UserProfiles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExperienceEntry_UserProfileId",
                table: "ExperienceEntry",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillEntry_UserProfileId",
                table: "SkillEntry",
                column: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExperienceEntry");

            migrationBuilder.DropTable(
                name: "SkillEntry");

            migrationBuilder.DropColumn(
                name: "ExpectedSalary",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WeeklyLearningAvailability",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WorkEnvironmentPreference",
                table: "UserProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "Interests",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Experience",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Goals",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Skills",
                table: "UserProfiles",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
