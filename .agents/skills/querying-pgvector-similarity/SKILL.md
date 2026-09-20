---
name: querying-pgvector-similarity
description: Use when implementing semantic search, job offer matching, skill embeddings, or vector distance queries in PostgreSQL using EF Core and pgvector
---

# Querying pgvector Similarity with EF Core

## Overview

Vocare utilizes the PostgreSQL `vector` extension (`pgvector`) combined with `Pgvector.EntityFrameworkCore` to power semantic job matching, skill clustering, and career path alignment. All embeddings use OpenAI's `text-embedding-3-small` model with exactly **1536 dimensions**. Vector similarity operations must be executed directly inside the PostgreSQL database engine using vector distance operators, never in application memory.

---

## When to Use

Use this skill when:
- Querying nearest neighbor job offers for a user's skills or career path.
- Calculating semantic similarity between normalized skills (`SkillEmbedding`).
- Configuring EF Core entities with vector columns (`Vector(1536)`).
- Adding or tuning HNSW / IVFFlat vector indexes in PostgreSQL migrations.

When **NOT** to use:
- Keyword or exact string filtering (use standard EF Core LINQ `==` or `ILIKE`).
- Storing unstructured JSON data without semantic similarity needs (use `jsonb`).

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"I'll load all job offers into memory with `ToListAsync()` and calculate cosine similarity in a C# loop."* | As the `JobOffers` table scales past thousands of rows, loading raw vectors into RAM causes Out-Of-Memory crashes and multi-second latency. PostgreSQL calculates distances natively in milliseconds. |
| *"I don't need a database vector index for now since testing data is small."* | Without an HNSW index (`vector_cosine_ops`), PostgreSQL performs full sequential table scans, causing database timeouts on Railway container deployments. |
| *"Any embedding size works as long as the model produces it."* | Schema columns are strongly typed to `vector(1536)`. Passing 512-dim or 3072-dim vectors causes fatal PostgreSQL type mismatch exceptions. |
| *"I should recalculate the skill vector each time a user searches."* | Standard skills are cached in `SkillEmbeddings`. Always query the pre-calculated embedding cache before invoking the OpenAI API. |

---

## Red Flags - STOP and Fix

- Fetching vectors to client/server RAM before filtering (`.ToList()` before `.OrderBy()`).
- Calculating cosine similarity with custom C# math functions instead of `EF.Functions.CosineDistance`.
- Using vector dimensions other than 1536.
- Generating embeddings in batch without Polly retry policies or rate limiting.
- Omitting `builder.HasPostgresExtension("vector");` in EF Core model configuration.

---

## Model & Index Configuration

File: `VocareWebAPI/Shared/Data/AppDbContext.cs`

```csharp
using Pgvector;
using Pgvector.EntityFrameworkCore;

// 1. Enable extension in OnModelCreating
modelBuilder.HasPostgresExtension("vector");

// 2. Configure entity vector property & HNSW index
modelBuilder.Entity<JobOffer>(entity =>
{
    entity.Property(e => e.Embedding)
          .HasColumnType("vector(1536)");

    // HNSW index for ultra-fast approximate nearest neighbor (ANN) search
    entity.HasIndex(e => e.Embedding)
          .HasMethod("hnsw")
          .HasOperators("vector_cosine_ops");
});
```

---

## Executing Native Distance Queries in LINQ

File: `VocareWebAPI/JobOffers/Repositories/Implementations/JobOfferRepository.cs`

```csharp
using Pgvector;
using Pgvector.EntityFrameworkCore;

public async Task<List<JobOfferMatchDto>> FindMatchingOffersAsync(
    Vector targetEmbedding,
    int limit = 10,
    decimal maxDistance = 0.5m
)
{
    // Cosine distance: 0 = identical, 2 = opposite
    // Similarity score = 1 - distance
    return await _context.JobOffers
        .AsNoTracking()
        .Where(j => j.IsActive && j.Embedding != null)
        .Select(j => new
        {
            Offer = j,
            Distance = EF.Functions.CosineDistance(j.Embedding!, targetEmbedding)
        })
        .Where(x => (decimal)x.Distance <= maxDistance)
        .OrderBy(x => x.Distance)
        .Take(limit)
        .Select(x => new JobOfferMatchDto
        {
            Id = x.Offer.Id,
            Title = x.Offer.Title,
            CompanyName = x.Offer.CompanyName,
            MatchScore = Math.Round((1.0 - x.Distance) * 100, 1),
            ReferenceNumber = x.Offer.ReferenceNumber
        })
        .ToListAsync();
}
```

---

## Cached Skill Embedding Lookup

Before calling OpenAI, always check the `SkillEmbeddings` cache:

```csharp
public async Task<Vector> GetOrCreateSkillEmbeddingAsync(string normalizedSkill)
{
    var cached = await _context.SkillEmbeddings
        .FirstOrDefaultAsync(s => s.SkillName == normalizedSkill);

    if (cached != null)
    {
        return cached.Embedding;
    }

    // Generate via OpenAI text-embedding-3-small (1536 dim)
    var vector = await _openAiEmbeddingService.GenerateEmbeddingAsync(normalizedSkill);

    _context.SkillEmbeddings.Add(new SkillEmbedding
    {
        SkillName = normalizedSkill,
        Embedding = vector,
        CreatedAt = DateTime.UtcNow
    });
    await _context.SaveChangesAsync();

    return vector;
}
```

---

## Quick Reference

| Operation | C# / LINQ Pattern | SQL Equivalent |
| :--- | :--- | :--- |
| **Cosine Distance** | `EF.Functions.CosineDistance(v1, v2)` | `v1 <=> v2` |
| **L2 (Euclidean) Distance** | `EF.Functions.L2Distance(v1, v2)` | `v1 <-> v2` |
| **Inner Product Distance** | `EF.Functions.VectorNegativeInnerProduct(v1, v2)` | `v1 <#> v2` |
| **Model Type** | `Pgvector.Vector` | `vector(1536)` |
| **Index Method** | `.HasMethod("hnsw")` | `CREATE INDEX ... USING hnsw` |
