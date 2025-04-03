﻿// <auto-generated />
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using VocareWebAPI.Data;

#nullable disable

namespace VocareWebAPI.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasDefaultSchema("Identity")
                .HasAnnotation("ProductVersion", "9.0.3")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRole", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("text");

                    b.Property<string>("ConcurrencyStamp")
                        .IsConcurrencyToken()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.Property<string>("NormalizedName")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.HasKey("Id");

                    b.HasIndex("NormalizedName")
                        .IsUnique()
                        .HasDatabaseName("RoleNameIndex");

                    b.ToTable("AspNetRoles", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("ClaimType")
                        .HasColumnType("text");

                    b.Property<string>("ClaimValue")
                        .HasColumnType("text");

                    b.Property<string>("RoleId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("RoleId");

                    b.ToTable("AspNetRoleClaims", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("ClaimType")
                        .HasColumnType("text");

                    b.Property<string>("ClaimValue")
                        .HasColumnType("text");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("UserId");

                    b.ToTable("AspNetUserClaims", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b =>
                {
                    b.Property<string>("LoginProvider")
                        .HasColumnType("text");

                    b.Property<string>("ProviderKey")
                        .HasColumnType("text");

                    b.Property<string>("ProviderDisplayName")
                        .HasColumnType("text");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("LoginProvider", "ProviderKey");

                    b.HasIndex("UserId");

                    b.ToTable("AspNetUserLogins", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b =>
                {
                    b.Property<string>("UserId")
                        .HasColumnType("text");

                    b.Property<string>("RoleId")
                        .HasColumnType("text");

                    b.HasKey("UserId", "RoleId");

                    b.HasIndex("RoleId");

                    b.ToTable("AspNetUserRoles", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b =>
                {
                    b.Property<string>("UserId")
                        .HasColumnType("text");

                    b.Property<string>("LoginProvider")
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Value")
                        .HasColumnType("text");

                    b.HasKey("UserId", "LoginProvider", "Name");

                    b.ToTable("AspNetUserTokens", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.AiRecommendation", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Justification")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("LongTermGoal")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PrimaryPath")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("RecommendationDate")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("UserId");

                    b.ToTable("AiRecommendations", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.CareerPath", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid?>("AiRecommendationId")
                        .HasColumnType("uuid");

                    b.Property<string>("CareerName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<Guid?>("CareerStatisticsId")
                        .HasColumnType("uuid");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.PrimitiveCollection<List<string>>("MarketAnalysis")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<string>("Probability")
                        .IsRequired()
                        .HasColumnType("text");

                    b.PrimitiveCollection<List<string>>("RecommendedCourses")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.PrimitiveCollection<List<string>>("RequiredSkills")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<Guid>("SwotAnalysisId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("AiRecommendationId");

                    b.HasIndex("CareerStatisticsId");

                    b.HasIndex("SwotAnalysisId");

                    b.ToTable("CareerPath", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.CareerStatistics", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("AiRecommendationId")
                        .HasColumnType("uuid");

                    b.Property<decimal>("AverageSalary")
                        .HasColumnType("numeric");

                    b.Property<string>("CareerName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("EmploymentRate")
                        .HasColumnType("integer");

                    b.Property<string>("GrowthForecast")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("LastUpdated")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("AiRecommendationId");

                    b.ToTable("CareerStatistics", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.MarketTrends", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("AiRecommendationId")
                        .HasColumnType("uuid");

                    b.Property<Guid?>("AiRecommendationId1")
                        .HasColumnType("uuid");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime?>("EndDate")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Impact")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("StartDate")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("TrendName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("AiRecommendationId");

                    b.HasIndex("AiRecommendationId1");

                    b.ToTable("MarketTrends", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.SkillDemand", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("AiRecommendationId")
                        .HasColumnType("uuid");

                    b.Property<int>("DemandLevel")
                        .HasColumnType("integer");

                    b.Property<string>("Industry")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("LastUpdated")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("SkillName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("AiRecommendationId");

                    b.ToTable("SkillDemand", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.NextStep", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid?>("AiRecommendationId")
                        .HasColumnType("uuid");

                    b.Property<string>("Step")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("AiRecommendationId");

                    b.ToTable("NextStep", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.SwotAnalysis", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.PrimitiveCollection<List<string>>("Opportunities")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.PrimitiveCollection<List<string>>("Strengths")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.PrimitiveCollection<List<string>>("Threats")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.PrimitiveCollection<List<string>>("Weaknesses")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.HasKey("Id");

                    b.ToTable("SwotAnalysis", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.User", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("text");

                    b.Property<int>("AccessFailedCount")
                        .HasColumnType("integer");

                    b.Property<string>("ConcurrencyStamp")
                        .IsConcurrencyToken()
                        .HasColumnType("text");

                    b.Property<string>("Email")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.Property<bool>("EmailConfirmed")
                        .HasColumnType("boolean");

                    b.Property<bool>("LockoutEnabled")
                        .HasColumnType("boolean");

                    b.Property<DateTimeOffset?>("LockoutEnd")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("NormalizedEmail")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.Property<string>("NormalizedUserName")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.Property<string>("PasswordHash")
                        .HasColumnType("text");

                    b.Property<string>("PhoneNumber")
                        .HasColumnType("text");

                    b.Property<bool>("PhoneNumberConfirmed")
                        .HasColumnType("boolean");

                    b.Property<string>("SecurityStamp")
                        .HasColumnType("text");

                    b.Property<bool>("TwoFactorEnabled")
                        .HasColumnType("boolean");

                    b.Property<string>("UserName")
                        .HasMaxLength(256)
                        .HasColumnType("character varying(256)");

                    b.HasKey("Id");

                    b.HasIndex("NormalizedEmail")
                        .HasDatabaseName("EmailIndex");

                    b.HasIndex("NormalizedUserName")
                        .IsUnique()
                        .HasDatabaseName("UserNameIndex");

                    b.ToTable("AspNetUsers", "Identity");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.UserProfile", b =>
                {
                    b.Property<string>("UserId")
                        .HasColumnType("text");

                    b.Property<string>("AboutMe")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("AdditionalInformation")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Address")
                        .IsRequired()
                        .HasColumnType("text");

                    b.PrimitiveCollection<List<string>>("Certificates")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<string>("Country")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Education")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("FirstName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.PrimitiveCollection<List<string>>("Languages")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<string>("LastName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PhoneNumber")
                        .HasColumnType("text");

                    b.PrimitiveCollection<List<string>>("Skills")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.PrimitiveCollection<List<string>>("WorkExperience")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.HasKey("UserId");

                    b.ToTable("UserProfiles", "Identity");
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b =>
                {
                    b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole", null)
                        .WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b =>
                {
                    b.HasOne("VocareWebAPI.Models.Entities.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b =>
                {
                    b.HasOne("VocareWebAPI.Models.Entities.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b =>
                {
                    b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole", null)
                        .WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("VocareWebAPI.Models.Entities.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b =>
                {
                    b.HasOne("VocareWebAPI.Models.Entities.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("VocareWebAPI.Models.AiRecommendation", b =>
                {
                    b.HasOne("VocareWebAPI.Models.Entities.UserProfile", "UserProfile")
                        .WithMany("Recommendations")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("UserProfile");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.CareerPath", b =>
                {
                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("CareerPaths")
                        .HasForeignKey("AiRecommendationId");

                    b.HasOne("VocareWebAPI.Models.Entities.MarketAnalysis.CareerStatistics", "CareerStatistics")
                        .WithMany()
                        .HasForeignKey("CareerStatisticsId");

                    b.HasOne("VocareWebAPI.Models.Entities.SwotAnalysis", "SwotAnalysis")
                        .WithMany()
                        .HasForeignKey("SwotAnalysisId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("CareerStatistics");

                    b.Navigation("SwotAnalysis");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.CareerStatistics", b =>
                {
                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("CareerStatistics")
                        .HasForeignKey("AiRecommendationId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.MarketTrends", b =>
                {
                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("MarketTrends")
                        .HasForeignKey("AiRecommendationId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("InfluencingTrends")
                        .HasForeignKey("AiRecommendationId1");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.MarketAnalysis.SkillDemand", b =>
                {
                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("SkillDemands")
                        .HasForeignKey("AiRecommendationId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.NextStep", b =>
                {
                    b.HasOne("VocareWebAPI.Models.AiRecommendation", null)
                        .WithMany("NextSteps")
                        .HasForeignKey("AiRecommendationId");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.UserProfile", b =>
                {
                    b.HasOne("VocareWebAPI.Models.Entities.User", "User")
                        .WithOne("UserProfile")
                        .HasForeignKey("VocareWebAPI.Models.Entities.UserProfile", "UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("VocareWebAPI.Models.AiRecommendation", b =>
                {
                    b.Navigation("CareerPaths");

                    b.Navigation("CareerStatistics");

                    b.Navigation("InfluencingTrends");

                    b.Navigation("MarketTrends");

                    b.Navigation("NextSteps");

                    b.Navigation("SkillDemands");
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.User", b =>
                {
                    b.Navigation("UserProfile")
                        .IsRequired();
                });

            modelBuilder.Entity("VocareWebAPI.Models.Entities.UserProfile", b =>
                {
                    b.Navigation("Recommendations");
                });
#pragma warning restore 612, 618
        }
    }
}
