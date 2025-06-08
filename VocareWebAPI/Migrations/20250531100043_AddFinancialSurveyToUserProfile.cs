using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialSurveyToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinancialSurveys",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CurrentSalary = table.Column<decimal>(type: "numeric", nullable: true),
                    DesiredSalary = table.Column<decimal>(type: "numeric", nullable: true),
                    HasLoans = table.Column<bool>(type: "boolean", nullable: false),
                    LoanDetails = table.Column<string>(type: "text", nullable: true),
                    RiskAppetite = table.Column<int>(type: "integer", nullable: false),
                    WillingToRelocate = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialSurveys", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_FinancialSurveys_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinancialSurveys",
                schema: "public");
        }
    }
}
