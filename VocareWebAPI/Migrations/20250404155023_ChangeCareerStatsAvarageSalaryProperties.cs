using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChangeCareerStatsAvarageSalaryProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AverageSalary",
                schema: "Identity",
                table: "CareerStatistics",
                newName: "AverageSalaryMin");

            migrationBuilder.AddColumn<decimal>(
                name: "AverageSalaryMax",
                schema: "Identity",
                table: "CareerStatistics",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AverageSalaryMax",
                schema: "Identity",
                table: "CareerStatistics");

            migrationBuilder.RenameColumn(
                name: "AverageSalaryMin",
                schema: "Identity",
                table: "CareerStatistics",
                newName: "AverageSalary");
        }
    }
}
