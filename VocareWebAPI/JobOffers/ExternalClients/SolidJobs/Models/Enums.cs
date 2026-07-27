namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models
{
public enum Division
{
    IT,
    Engineering,
    Marketing,
    Sales,
    HR,
    Logistics,
    Finances,
    Other,
    }

public enum SortField
{
    ValidFrom,
    ValidTo,
    Title,
    Company,
    SalaryFrom,
    SalaryTo,
    ExperienceLevel,
}

public enum SortDirection
{
    Asc,
    Desc,
}

public enum ExperienceLevel
{
    None,
    Intern,
    Junior,
    Regular,
    Senior,
}

public enum SkillLevel
{
    NiceToHave,
    Basic,
    Advanced,
    Expert,
}

public enum JobCategory
{
    // IT
    Developer, Architect, Tester, ItManager, DataScience, Security, Support, DevOps,
    Analyst, Administrator, UXUIDesigner, OtherIT,
    // Engineering
    AutomationAndRobotics, Mechatronics, TechnologicalEngineering, QualityEngineering,
    ProductionEngineering, ConstructionAndDesign, MaintenanceEngineering,
    ElectronicsAndTelecommunication, OtherEngineering,
    // Marketing
    Marketing, Copywriter, SocialMediaSpecialist, SEO, EmployerBrandingSpecialist,
    MediaAndJournalism, ECommerce, OtherMarketing,
    // Sales
    B2BSales, B2CSales, AccountManager, CustomerSuccess, OtherSales,
    // HR
    Recruiter, HRSpecialist, GrowthAndCourses, OtherHr,
    // Logistics
    SupplyChain, Transport, PurchasesAndSupplies, ProductionPlanning, OtherLogistics,
    // Finance
    Accounting, AnalyticsAndControlling, AccountingConsulting, AuditsAndCompliance,
    Insurance, OtherFinances,
    // Other
    Management, ResearchAndDevelopment, LawAndAdministration, OtherOther,
}

public enum JobSubCategory
{
    // Developer
    JavaScript, Python, DotNet, Java, PHP, Android, IOS, Scala, Ruby, CCPlusPlus,
    Angular, React, NodeJs, Golang, OtherDeveloper,
    // Architect
    Architect,
    // Tester
    ManualTester, TestAutomationEngineer, OtherTester,
    // IT Manager
    ProjectManager, ProductManager, ScrumMaster, ProductOwner, OtherItManager,
    // Data / Security / Support / DevOps / Analyst
    DataScience, Security, Support, DevOps, Analyst,
    // Administrator
    SystemsAdministrator, NetworkAdministrator, DatabaseAdministrator, CloudAdministrator,
    OtherAdministrator,
    // UX/UI + Other IT
    UXUIDesigner, OtherIT, ERP,
    // Engineering
    AutomationAndRobotics, Mechatronics, TechnologicalEngineering, QualityEngineering,
    ProductionEngineering, ConstructionAndDesign, MaintenanceEngineering,
    ElectronicsAndTelecommunication, OtherEngineering,
    // Marketing
    Marketing, Copywriter, SocialMediaSpecialist, SEO, EmployerBrandingSpecialist,
    MediaAndJournalism, ECommerce, OtherMarketing,
    // Sales
    B2BSales, B2CSales, AccountManager, CustomerSuccess, OtherSales,
    // HR
    Recruiter, HRSpecialist, GrowthAndCourses, OtherHr,
    // Logistics
    SupplyChain, Transport, PurchasesAndSupplies, ProductionPlanning, OtherLogistics,
    // Finance
    Accounting, AnalyticsAndControlling, AccountingConsulting, AuditsAndCompliance,
    Insurance, OtherFinances,
    // Management / Other
    Management, ResearchAndDevelopment, LawAndAdministration,
    GraphicDesigner, Backoffice, OtherOther,
}}
