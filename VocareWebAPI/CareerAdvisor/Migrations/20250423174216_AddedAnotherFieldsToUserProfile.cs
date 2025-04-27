using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedAnotherFieldsToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Certificates",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Education",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Languages",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WorkExperience",
                schema: "Identity",
                table: "UserProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "AdditionalInformation",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "AboutMe",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "CertificateEntry",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Issuer = table.Column<string>(type: "text", nullable: true),
                    UserProfileUserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateEntry_UserProfiles_UserProfileUserId",
                        column: x => x.UserProfileUserId,
                        principalSchema: "Identity",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "EducationEntry",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Insititution = table.Column<string>(type: "text", nullable: false),
                    Degree = table.Column<string>(type: "text", nullable: false),
                    Field = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserProfileUserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationEntry_UserProfiles_UserProfileUserId",
                        column: x => x.UserProfileUserId,
                        principalSchema: "Identity",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "LanguageEntry",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Language = table.Column<string>(type: "text", nullable: false),
                    Level = table.Column<string>(type: "text", nullable: false),
                    UserProfileUserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LanguageEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LanguageEntry_UserProfiles_UserProfileUserId",
                        column: x => x.UserProfileUserId,
                        principalSchema: "Identity",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "WorkExperienceEntry",
                schema: "Identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Company = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserProfileUserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkExperienceEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkExperienceEntry_UserProfiles_UserProfileUserId",
                        column: x => x.UserProfileUserId,
                        principalSchema: "Identity",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CertificateEntry_UserProfileUserId",
                schema: "Identity",
                table: "CertificateEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationEntry_UserProfileUserId",
                schema: "Identity",
                table: "EducationEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LanguageEntry_UserProfileUserId",
                schema: "Identity",
                table: "LanguageEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkExperienceEntry_UserProfileUserId",
                schema: "Identity",
                table: "WorkExperienceEntry",
                column: "UserProfileUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CertificateEntry",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "EducationEntry",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "LanguageEntry",
                schema: "Identity");

            migrationBuilder.DropTable(
                name: "WorkExperienceEntry",
                schema: "Identity");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AdditionalInformation",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AboutMe",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "Certificates",
                schema: "Identity",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "Education",
                schema: "Identity",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<List<string>>(
                name: "Languages",
                schema: "Identity",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<List<string>>(
                name: "WorkExperience",
                schema: "Identity",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);
        }
    }
}
