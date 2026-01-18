using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddJobOffersModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobOffers",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: true),
                    SeniorityLevel = table.Column<int>(type: "integer", nullable: false),
                    JobType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    BriefDescription = table.Column<string>(type: "text", nullable: false),
                    SalaryMin = table.Column<decimal>(type: "numeric", nullable: true),
                    SalaryMax = table.Column<decimal>(type: "numeric", nullable: true),
                    SalaryCurrency = table.Column<string>(type: "text", nullable: true),
                    SalaryPeriod = table.Column<int>(type: "integer", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobOffers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobOfferLocations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobOfferId = table.Column<Guid>(type: "uuid", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    IsRemote = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobOfferLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobOfferLocations_JobOffers_JobOfferId",
                        column: x => x.JobOfferId,
                        principalSchema: "public",
                        principalTable: "JobOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobOffferSkills",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JobOfferId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobOffferSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobOffferSkills_JobOffers_JobOfferId",
                        column: x => x.JobOfferId,
                        principalSchema: "public",
                        principalTable: "JobOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobOfferLocations_City",
                schema: "public",
                table: "JobOfferLocations",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_JobOfferLocations_JobOfferId",
                schema: "public",
                table: "JobOfferLocations",
                column: "JobOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_JobOffers_ReferenceNumber",
                schema: "public",
                table: "JobOffers",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobOffferSkills_JobOfferId",
                schema: "public",
                table: "JobOffferSkills",
                column: "JobOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_JobOffferSkills_Name",
                schema: "public",
                table: "JobOffferSkills",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobOfferLocations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "JobOffferSkills",
                schema: "public");

            migrationBuilder.DropTable(
                name: "JobOffers",
                schema: "public");
        }
    }
}
