﻿using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace VocareWebAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServiceCosts",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ServiceName = table.Column<string>(type: "text", nullable: false),
                    TokenCost = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SwotAnalysis",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Strengths = table.Column<List<string>>(type: "text[]", nullable: false),
                    Weaknesses = table.Column<List<string>>(type: "text[]", nullable: false),
                    Opportunities = table.Column<List<string>>(type: "text[]", nullable: false),
                    Threats = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SwotAnalysis", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TokenTransactions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ServiceName = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenTransactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "public",
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                schema: "public",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "public",
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GeneratedCvs",
                schema: "public",
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
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserBillings",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TokenBalance = table.Column<int>(type: "integer", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "text", nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "text", nullable: true),
                    SubscriptionStatus = table.Column<int>(type: "integer", nullable: false),
                    SubscriptionLevel = table.Column<int>(type: "integer", nullable: false),
                    LastTokenPurchaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SubscriptionEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBillings", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserBillings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserProfiles",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    Skills = table.Column<List<string>>(type: "text[]", nullable: false),
                    AdditionalInformation = table.Column<string>(type: "text", nullable: true),
                    AboutMe = table.Column<string>(type: "text", nullable: true),
                    PersonalityType = table.Column<int>(type: "integer", nullable: false),
                    SoftSkills = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserProfiles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiRecommendations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RecommendationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrimaryPath = table.Column<string>(type: "text", nullable: false),
                    Justification = table.Column<string>(type: "text", nullable: false),
                    LongTermGoal = table.Column<string>(type: "text", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiRecommendations_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AiRecommendations_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CertificateEntry",
                schema: "public",
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
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EducationEntry",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Institution = table.Column<string>(type: "text", nullable: false),
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
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LanguageEntry",
                schema: "public",
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
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkExperienceEntry",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Company = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Responsibilities = table.Column<List<string>>(type: "text[]", nullable: true),
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
                        principalSchema: "public",
                        principalTable: "UserProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CareerStatistics",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerName = table.Column<string>(type: "text", nullable: false),
                    AverageSalaryMin = table.Column<decimal>(type: "numeric", nullable: false),
                    AverageSalaryMax = table.Column<decimal>(type: "numeric", nullable: false),
                    EmploymentRate = table.Column<int>(type: "integer", nullable: false),
                    GrowthForecast = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CareerStatistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CareerStatistics_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MarketTrends",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrendName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketTrends", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketTrends_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NextStep",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Step = table.Column<string>(type: "text", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NextStep", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NextStep_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SkillDemand",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillName = table.Column<string>(type: "text", nullable: false),
                    Industry = table.Column<string>(type: "text", nullable: false),
                    DemandLevel = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillDemand", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillDemand_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CareerPath",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Probability = table.Column<string>(type: "text", nullable: false),
                    RequiredSkills = table.Column<List<string>>(type: "text[]", nullable: false),
                    MarketAnalysis = table.Column<List<string>>(type: "text[]", nullable: false),
                    RecommendedCourses = table.Column<List<string>>(type: "text[]", nullable: false),
                    SwotAnalysisId = table.Column<Guid>(type: "uuid", nullable: false),
                    CareerStatisticsId = table.Column<Guid>(type: "uuid", nullable: true),
                    AiRecommendationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CareerPath", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CareerPath_AiRecommendations_AiRecommendationId",
                        column: x => x.AiRecommendationId,
                        principalSchema: "public",
                        principalTable: "AiRecommendations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CareerPath_CareerStatistics_CareerStatisticsId",
                        column: x => x.CareerStatisticsId,
                        principalSchema: "public",
                        principalTable: "CareerStatistics",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CareerPath_SwotAnalysis_SwotAnalysisId",
                        column: x => x.SwotAnalysisId,
                        principalSchema: "public",
                        principalTable: "SwotAnalysis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "ServiceCosts",
                columns: new[] { "Id", "ServiceName", "TokenCost" },
                values: new object[,]
                {
                    { 1, "AnalyzeProfile", 5 },
                    { 2, "GenerateCV", 5 },
                    { 3, "MarketAnalysis", 5 },
                    { 4, "GenerateCv", 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_AiRecommendationId",
                schema: "public",
                table: "AiRecommendations",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_AiRecommendations_UserId",
                schema: "public",
                table: "AiRecommendations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                schema: "public",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                schema: "public",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                schema: "public",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                schema: "public",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                schema: "public",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                schema: "public",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                schema: "public",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_AiRecommendationId",
                schema: "public",
                table: "CareerPath",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_CareerStatisticsId",
                schema: "public",
                table: "CareerPath",
                column: "CareerStatisticsId");

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_SwotAnalysisId",
                schema: "public",
                table: "CareerPath",
                column: "SwotAnalysisId");

            migrationBuilder.CreateIndex(
                name: "IX_CareerStatistics_AiRecommendationId",
                schema: "public",
                table: "CareerStatistics",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateEntry_UserProfileUserId",
                schema: "public",
                table: "CertificateEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationEntry_UserProfileUserId",
                schema: "public",
                table: "EducationEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedCvs_UserId",
                schema: "public",
                table: "GeneratedCvs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LanguageEntry_UserProfileUserId",
                schema: "public",
                table: "LanguageEntry",
                column: "UserProfileUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_AiRecommendationId",
                schema: "public",
                table: "MarketTrends",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_NextStep_AiRecommendationId",
                schema: "public",
                table: "NextStep",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillDemand_AiRecommendationId",
                schema: "public",
                table: "SkillDemand",
                column: "AiRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkExperienceEntry_UserProfileUserId",
                schema: "public",
                table: "WorkExperienceEntry",
                column: "UserProfileUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens",
                schema: "public");

            migrationBuilder.DropTable(
                name: "CareerPath",
                schema: "public");

            migrationBuilder.DropTable(
                name: "CertificateEntry",
                schema: "public");

            migrationBuilder.DropTable(
                name: "EducationEntry",
                schema: "public");

            migrationBuilder.DropTable(
                name: "GeneratedCvs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "LanguageEntry",
                schema: "public");

            migrationBuilder.DropTable(
                name: "MarketTrends",
                schema: "public");

            migrationBuilder.DropTable(
                name: "NextStep",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ServiceCosts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SkillDemand",
                schema: "public");

            migrationBuilder.DropTable(
                name: "TokenTransactions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "UserBillings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "WorkExperienceEntry",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetRoles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "CareerStatistics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SwotAnalysis",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AiRecommendations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "UserProfiles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AspNetUsers",
                schema: "public");
        }
    }
}
