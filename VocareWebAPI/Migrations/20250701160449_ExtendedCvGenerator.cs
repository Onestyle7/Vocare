using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class ExtendedCvGenerator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GeneratedCvs_UserId",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "Position",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "RawApiResponse",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.RenameColumn(
                name: "GeneratedAt",
                schema: "public",
                table: "GeneratedCvs",
                newName: "LastModifiedAt");

            migrationBuilder.AlterColumn<string>(
                name: "CvJson",
                schema: "public",
                table: "GeneratedCvs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(8000)",
                oldMaxLength: 8000);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "GeneratedCvs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "public",
                table: "GeneratedCvs",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                schema: "public",
                table: "GeneratedCvs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "public",
                table: "GeneratedCvs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                schema: "public",
                table: "GeneratedCvs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetPosition",
                schema: "public",
                table: "GeneratedCvs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                schema: "public",
                table: "GeneratedCvs",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedCvs_UserId_IsActive",
                schema: "public",
                table: "GeneratedCvs",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GeneratedCvs_UserId_IsActive",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "IsDefault",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "Notes",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "TargetPosition",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.DropColumn(
                name: "Version",
                schema: "public",
                table: "GeneratedCvs");

            migrationBuilder.RenameColumn(
                name: "LastModifiedAt",
                schema: "public",
                table: "GeneratedCvs",
                newName: "GeneratedAt");

            migrationBuilder.AlterColumn<string>(
                name: "CvJson",
                schema: "public",
                table: "GeneratedCvs",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "Position",
                schema: "public",
                table: "GeneratedCvs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawApiResponse",
                schema: "public",
                table: "GeneratedCvs",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedCvs_UserId",
                schema: "public",
                table: "GeneratedCvs",
                column: "UserId");
        }
    }
}
