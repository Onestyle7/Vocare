using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class SplitRoadmapStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                schema: "public",
                table: "Roadmaps",
                newName: "LifecycleStatus"
            );

            migrationBuilder.AddColumn<string>(
                name: "FailureReason",
                schema: "public",
                table: "Roadmaps",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "GenerationStatus",
                schema: "public",
                table: "Roadmaps",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );
            migrationBuilder.Sql("UPDATE public.\"Roadmaps\" SET \"GenerationStatus\" = 2");

            migrationBuilder.AddColumn<string>(
                name: "HangfireJobId",
                schema: "public",
                table: "Roadmaps",
                type: "text",
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FailureReason", schema: "public", table: "Roadmaps");

            migrationBuilder.DropColumn(
                name: "GenerationStatus",
                schema: "public",
                table: "Roadmaps"
            );

            migrationBuilder.DropColumn(name: "HangfireJobId", schema: "public", table: "Roadmaps");

            migrationBuilder.RenameColumn(
                name: "LifecycleStatus",
                schema: "public",
                table: "Roadmaps",
                newName: "Status"
            );
        }
    }
}
