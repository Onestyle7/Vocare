---
name: scaffolding-vertical-slice
description: Use when adding a new endpoint, domain entity, database model, or fullstack feature connecting the .NET WebAPI backend to the Next.js frontend
---

# Scaffolding Fullstack Vertical Slices

## Overview

In Vocare, features are organized into self-contained vertical slices in the .NET 9 backend (`VocareWebAPI/<ModuleName>/`) and feature modules in the Next.js 16 frontend (`frontend/features/<module>/`). Implementing a feature end-to-end requires completing every layer systematically: entity definition, EF Core registration and migration, DTOs, repository, business service, controller with security policies, DI registration, and frontend DAL integration.

---

## When to Use

Use this skill when:
- Adding a new database-backed entity or domain model to Vocare.
- Creating a new WebAPI endpoint or controller.
- Wiring a new backend service to the Next.js frontend.
- Extending an existing slice with new actions or workflows.

When **NOT** to use:
- Pure frontend styling or UI tweaks without backend changes.
- Isolated bug fixes within an existing service method.

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"I will inject `AppDbContext` directly into the Controller to avoid creating repository boilerplate."* | Violates Vocare's architectural standard. All data operations must pass through a repository interface (`IRepository`) and domain service (`IService`). |
| *"I can test the feature first and register it in `DependencyInjectionExtensions.cs` later."* | The app will compile cleanly but fail at runtime with `InvalidOperationException: Unable to resolve service`. DI registration is a mandatory step of the scaffolding workflow. |
| *"Rate limiting is only needed for production release, not while building."* | Missing rate-limiting attributes (`[EnableRateLimiting]`) creates security risks and will fail code review standards. |
| *"I'll create the frontend DTO manually and match it with C# by eye."* | Schema drift happens immediately. Schemas must be defined in `zod` (`schemas.ts`) mirroring the C# DTOs. |

---

## Red Flags - STOP and Fix

- Directly accessing `AppDbContext` inside any Controller or Frontend action.
- Skipping registration in `VocareWebAPI/Shared/Data/AppDbContext.cs`.
- Skipping registration in `VocareWebAPI/Extensions/ServiceCollectionExtensions/DependencyInjectionExtensions.cs`.
- Controller action missing `[Authorize]` (unless explicitly an unauthenticated endpoint).
- Missing migration after adding or modifying entity properties.
- Mismatch between C# property casing (PascalCase) and JSON payload casing (camelCase).

---

## Backend Vertical Slice Architecture

A standard slice in `VocareWebAPI/<ModuleName>/` contains:

```text
VocareWebAPI/<ModuleName>/
├── Controllers/         # API Controllers ([ApiController], [Route("api/[controller]")])
├── Services/
│   ├── Interfaces/      # I<Feature>Service
│   └── Implementations/ # <Feature>Service (business logic, billing checks)
├── Repositories/
│   ├── Interfaces/      # I<Feature>Repository
│   └── Implementations/ # <Feature>Repository (EF Core AppDbContext queries)
├── Models/
│   ├── Entities/        # EF Core database entities
│   ├── Dtos/            # Request / Response DTOs
│   └── Enums/           # Domain enums
└── Exceptions/          # Domain exceptions (see handling-dotnet-domain-exceptions)
```

---

## End-to-End Scaffolding Checklist

Follow these 8 steps in order:

### 1. Define Entity
File: `VocareWebAPI/<ModuleName>/Models/Entities/<EntityName>.cs`

```csharp
namespace VocareWebAPI.<ModuleName>.Models.Entities
{
    public class JobApplicationNote
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string UserId { get; set; } = string.Empty;
        public Guid JobOfferId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
```

### 2. Register Entity in `AppDbContext`
File: `VocareWebAPI/Shared/Data/AppDbContext.cs`

```csharp
public DbSet<JobApplicationNote> JobApplicationNotes { get; set; }

// In OnModelCreating:
builder.Entity<JobApplicationNote>(b =>
{
    b.HasKey(n => n.Id);
    b.HasIndex(n => new { n.UserId, n.JobOfferId });
});
```

### 3. Generate EF Core Migration
Execute from terminal:
```bash
dotnet ef migrations add AddJobApplicationNotes --project VocareWebAPI
```

### 4. Create DTOs
File: `VocareWebAPI/<ModuleName>/Models/Dtos/<EntityName>Dtos.cs`

```csharp
namespace VocareWebAPI.<ModuleName>.Models.Dtos
{
    public record CreateNoteDto(Guid JobOfferId, string Content);
    public record NoteResponseDto(Guid Id, Guid JobOfferId, string Content, DateTime CreatedAt);
}
```

### 5. Create Repository (Interface & Implementation)
File: `VocareWebAPI/<ModuleName>/Repositories/Interfaces/IJobNoteRepository.cs`

```csharp
public interface IJobNoteRepository
{
    Task<JobApplicationNote?> GetByIdAsync(Guid id, string userId);
    Task<List<JobApplicationNote>> GetByJobOfferAsync(Guid jobOfferId, string userId);
    Task AddAsync(JobApplicationNote note);
    Task SaveChangesAsync();
}
```

### 6. Create Service (Interface & Implementation)
File: `VocareWebAPI/<ModuleName>/Services/Implementations/JobNoteService.cs`

```csharp
public class JobNoteService : IJobNoteService
{
    private readonly IJobNoteRepository _repository;

    public JobNoteService(IJobNoteRepository repository)
    {
        _repository = repository;
    }

    public async Task<NoteResponseDto> CreateNoteAsync(string userId, CreateNoteDto dto)
    {
        var note = new JobApplicationNote
        {
            UserId = userId,
            JobOfferId = dto.JobOfferId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(note);
        await _repository.SaveChangesAsync();

        return new NoteResponseDto(note.Id, note.JobOfferId, note.Content, note.CreatedAt);
    }
}
```

### 7. Implement Controller with Rate Limiting
File: `VocareWebAPI/<ModuleName>/Controllers/JobNotesController.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("Global")]
public class JobNotesController : ControllerBase
{
    private readonly IJobNoteService _jobNoteService;

    public JobNotesController(IJobNoteService jobNoteService)
    {
        _jobNoteService = jobNoteService;
    }

    [HttpPost]
    public async Task<ActionResult<NoteResponseDto>> CreateNote([FromBody] CreateNoteDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _jobNoteService.CreateNoteAsync(userId, dto);
        return CreatedAtAction(nameof(CreateNote), new { id = result.Id }, result);
    }
}
```

### 8. Register in Dependency Injection
File: `VocareWebAPI/Extensions/ServiceCollectionExtensions/DependencyInjectionExtensions.cs`

```csharp
services.AddScoped<IJobNoteRepository, JobNoteRepository>();
services.AddScoped<IJobNoteService, JobNoteService>();
```

### 9. Frontend Integration
Create the corresponding DAL feature folder following `implementing-nextjs-dal`:
- `frontend/features/<module>/dal/schemas.ts`
- `frontend/features/<module>/dal/api.ts`
- `frontend/features/<module>/dal/services.ts`
- `frontend/features/<module>/dal/queries.ts`
- `frontend/features/<module>/dal/commands.ts`
