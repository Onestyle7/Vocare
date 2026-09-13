# Vocare — Global Project Conventions & Agent Guidelines

## 1. Project Overview
**Vocare** is an AI-powered career development platform that provides candidate profile analysis, resume generation, tailoring, and quality auditing, interactive career roadmaps, and semantic job offer matching.

- **Primary References**:
  - [.agents/instructions/project-map.md](.agents/instructions/project-map.md): Domain map, database schema, and full API endpoint catalog.
  - [.agents/instructions/cv-quality-audit-design.md](.agents/instructions/cv-quality-audit-design.md): CV Quality Audit UI/UX design specification and copywriting standards.
- **Procedural Skills**: Consult specialized skills in [.agents/skills/](.agents/skills/) when executing vertical slice scaffolding, DAL integration, vector search, token billing, or legal enforcement.

---

## 2. Monorepo Structure & Tech Stack

```text
Vocare/
├── VocareWebAPI/       # .NET 9 Web API backend (Clean Architecture / Vertical Slices)
├── VocareWebApi.Tests/ # Backend test suite
├── frontend/           # Next.js 16 (App Router) + React 19.1 + TypeScript 5
├── mobile/             # Flutter cross-platform mobile application (Dart)
├── .agents/
│   ├── instructions/   # Architecture and design specs (project-map.md, cv-quality-audit-design.md)
│   └── skills/         # Procedural runbooks for specific multi-step workflows
├── .husky/             # Git commit hooks (lint-staged, formatting)
└── railway.toml        # Railway container deployment configuration
```

### Backend (.NET 9 / C#)
- **Framework & ORM**: .NET 9 (`Microsoft.NET.Sdk.Web`), Entity Framework Core 9.0.3, Npgsql 9.0.4.
- **Vector Search**: PostgreSQL + `pgvector` (1536-dimensional OpenAI `text-embedding-3-small` embeddings).
- **Background Jobs**: Hangfire 1.8.23 with PostgreSQL storage.
- **Authentication**: ASP.NET Core Identity with encrypted `IDataProtectionProvider` bearer tokens ("VocareAuth").
- **AI Integrations**: OpenAI API and Perplexity AI via resilient `HttpClient` wrapped with Polly.
- **Payments**: `Stripe.net` (48.0.0) with webhooks and customer portal.
- **Document Processing**: `PdfPig` for parsing uploaded PDF resumes.
- **Code Style & Formatting**: `csharpier` (`0.30.6`). All C# code must conform to CSharpier rules.

### Frontend (Next.js 16 / React 19 / TypeScript)
- **Core**: Next.js 16 (App Router), React 19.1.0, TypeScript 5 (strict typing, `@/*` aliases).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), Radix UI / `shadcn/ui`, semantic light/dark theme variables. Brand accent: `#915EFF`.
- **Canvas / Graphs**: `@xyflow/react` (React Flow) for the Career Roadmap graph.
- **Validation & Forms**: `react-hook-form`, `zod`, `@hookform/resolvers`.
- **Functional Error Handling**: `neverthrow` (`Result<ApiResponse<T>, ApiError>`).
- **Code Style & Formatting**: ESLint 9 (flat config), Prettier with Tailwind plugin.

### Mobile (Flutter)
- Located in `/mobile` for iOS and Android deployment.

---

## 3. Core Architectural Invariants & Rules

### Backend Invariants (.NET 9)
1. **Vertical Slice Modularity**:
   - Features reside in self-contained slices (`VocareWebAPI/<ModuleName>/`: `Billing`, `CareerAdvisor`, `CvGenerator`, `JobOffers`, `Legal`, `MarketNews`, `RoadmapService`, `UserManagement`).
   - Slices maintain their own controllers, services, repositories, models, and domain exceptions.
   - Register dependencies via extension methods in `VocareWebAPI/Extensions/ServiceCollectionExtensions/`.
2. **Result Pattern & Error Handling**:
   - Prefer returning `Result<T>` (`Shared/Results/Result.cs`) or well-typed domain exceptions.
   - Domain exceptions inherit from base exceptions and map to HTTP status codes via `AddGlobalExceptionHandling()`.
3. **Legal Consents "Hard Wall" (GDPR)**:
   - `LegalConsentsMiddleware` strictly intercepts authenticated requests.
   - If the token lacks `consents_valid == true`, the request is blocked with **HTTP 403 `CONSENTS_REQUIRED`**.
   - Allowed bypass routes: `/api/legal/*`, `/api/auth/*`, `/health`, and `/swagger`.
4. **Token Metering for AI Services**:
   - Any billable AI action must verify and deduct tokens via `_billingService`:
     ```csharp
     await _billingService.CanAccessServiceAsync(userId, "ServiceName");
     // ... perform AI operation ...
     await _billingService.DeductTokensForServiceAsync(userId, "ServiceName");
     ```
   - Standard costs: `AnalyzeProfile` (60), `MarketAnalysis` (50), `GenerateCvFromProfile` (20), `TailorCv` (20), `AnalyzeCv` (10).
5. **Database Resilience**:
   - All migrations run with retry loops on container startup to handle Railway database spin-up delays.
   - All vector queries must utilize PostgreSQL cosine distance `<=>` against `vector(1536)` columns.

### Frontend Invariants (Next.js 16)
1. **Server Components by Default**:
   - Pages and components in `app/` and `features/` are Server Components (`async Server Component`) by default.
   - Add `'use client'` strictly when client state (`useState`, `useEffect`), DOM event listeners, or canvas interactions (React Flow) are required.
2. **Data Access Layer (DAL) Isolation**:
   - Keep data logic inside `features/<module>/dal/`:
     - `api.ts`: Scoped `ApiClient` instance.
     - `queries.ts`: Read operations wrapped in `React.cache()` with cache tags (`lib/tags.ts`).
     - `commands.ts` / `mutations.ts`: Server Actions executing mutations and calling `revalidateTag()`.
     - `services.ts`: Direct client API call handlers.
3. **Functional Result Pattern (`neverthrow`)**:
   - `apiClient` returns `Result<ApiResponse<T>, ApiError>`.
   - Never throw raw client exceptions; handle responses via `.match()`, `result.isOk()`, or `result.isErr()`.
4. **UI & Accessibility**:
   - Support dark/light mode via semantic CSS variables (`background`, `foreground`, `border`, `muted`).
   - In CV Quality Audit: a score of `0` due to a missing target position must be treated as an actionable prompt to set the target role, never as an error.

---

## 4. Skills & Runbooks Quick Reference

When performing specific workflows, activate the corresponding skill in [.agents/skills/](.agents/skills/):
- **`scaffolding-vertical-slice`**: Adding new database models, EF Core migrations, repositories, services, controllers, and frontend wiring.
- **`implementing-nextjs-dal`**: Writing data queries, Server Actions, cache tagging, and `neverthrow` handling in the Next.js frontend.
- **`querying-pgvector-similarity`**: EF Core and raw SQL vector distance queries, cosine similarity, and embedding management.
- **`metering-service-tokens`**: Integrating token checks, balance deduction, Stripe payments, and webhook handlers.
- **`enforcing-legal-hardwall`**: Modifying consent workflows, route whitelists, or handling `CONSENTS_REQUIRED` responses.
- **`auditing-cv-quality`**: Implementing or modifying CV analysis, scoring formulas, and recommendations (see [.agents/instructions/cv-quality-audit-design.md](.agents/instructions/cv-quality-audit-design.md)).
- **`handling-dotnet-domain-exceptions`**: Creating custom domain exceptions, result wrappers, and global error mappings.
