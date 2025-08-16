using AutoMapper;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebApi.Tests.TestModels
{
    // ❌ USUNĄŁEM LoginRequest - już istnieje w głównym projekcie!

    // Dodatkowe modele dla testów jeśli nie istnieją w głównym projekcie
    public class AiConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
    }

    public class MockEmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string body)
        {
            return Task.CompletedTask;
        }
    }

    // Interface dla UserRegistrationHandler jeśli nie istnieje
    public interface IUserRegistrationHandler
    {
        Task HandleUserRegistrationAsync(string userId);
    }

    // ✅ DODANE: Fake implementacja dla testów
    public class FakeUserRegistrationHandler
    {
        public virtual async Task HandleUserRegistrationAsync(string userId)
        {
            // Fake implementation - nic nie robi
            await Task.CompletedTask;
        }
    }

    public class UserProfileMappingProfile : Profile
    {
        public UserProfileMappingProfile()
        {
            // Dodaj mapowania jeśli potrzebne
        }
    }

    // Dodaj inne brakujące enums/klasy jeśli nie istnieją
    public enum PersonalityType
    {
        Architect,
        Mediator,
        Commander,
    }

    public enum Risk
    {
        Low,
        Medium,
        High,
    }

    // Dodaj brakujące DTOs jeśli nie istnieją
    public class UserProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public PersonalityType PersonalityType { get; set; }
        public FinancialSurveyDto? FinancialSurvey { get; set; }
        public List<EducationEntryDto>? Education { get; set; }
    }

    public class FinancialSurveyDto
    {
        public decimal CurrentSalary { get; set; }
        public decimal DesiredSalary { get; set; }
        public bool HasLoans { get; set; }
        public Risk RiskAppetite { get; set; }
        public bool WillingToRelocate { get; set; }
    }

    public class EducationEntryDto
    {
        public string Institution { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
    }

    // Entities dla testów
    public class WorkExperienceEntry
    {
        public string Company { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<string> Responsibilities { get; set; } = new();
    }

    public class EducationEntry
    {
        public string Institution { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class CertificateEntry
    {
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }

    public class LanguageEntry
    {
        public string Language { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
    }

    public class AiRecommendation
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime RecommendationDate { get; set; }
        public string PrimaryPath { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
        public string LongTermGoal { get; set; } = string.Empty;
        public List<CareerPath> CareerPaths { get; set; } = new();
        public List<NextStep> NextSteps { get; set; } = new();
        public UserProfile? UserProfile { get; set; }
    }

    public class CareerPath
    {
        public string CareerName { get; set; } = string.Empty;
    }

    public class NextStep
    {
        public string Step { get; set; } = string.Empty;
    }

    public class CareerStatistics
    {
        public string Industry { get; set; } = string.Empty;
        public decimal MinSalary { get; set; }
        public decimal MaxSalary { get; set; }
    }

    public class SkillDemand
    {
        public string Skill { get; set; } = string.Empty;
        public string DemandLevel { get; set; } = string.Empty;
    }

    public class MarketTrends
    {
        public string TrendName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
