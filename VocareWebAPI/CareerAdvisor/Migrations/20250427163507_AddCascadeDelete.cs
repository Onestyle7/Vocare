using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CertificateEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "CertificateEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_EducationEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "EducationEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_LanguageEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "LanguageEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkExperienceEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "WorkExperienceEntry");

            migrationBuilder.AddColumn<string>(
                name: "UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "UserProfileUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AiRecommendations_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CertificateEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "CertificateEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_EducationEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "EducationEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LanguageEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "LanguageEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkExperienceEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "WorkExperienceEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AiRecommendations_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropForeignKey(
                name: "FK_CertificateEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "CertificateEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_EducationEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "EducationEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_LanguageEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "LanguageEntry");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkExperienceEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "WorkExperienceEntry");

            migrationBuilder.DropIndex(
                name: "IX_AiRecommendations_UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.DropColumn(
                name: "UserProfileUserId",
                schema: "Identity",
                table: "AiRecommendations");

            migrationBuilder.AddForeignKey(
                name: "FK_CertificateEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "CertificateEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_EducationEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "EducationEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LanguageEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "LanguageEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkExperienceEntry_UserProfiles_UserProfileUserId",
                schema: "Identity",
                table: "WorkExperienceEntry",
                column: "UserProfileUserId",
                principalSchema: "Identity",
                principalTable: "UserProfiles",
                principalColumn: "UserId");
        }
    }
}
