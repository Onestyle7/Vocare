---
name: implementing-nextjs-dal
description: Use when implementing or modifying data fetching, mutations, Server Actions, or API clients in the Next.js frontend, especially when handling API responses or cache revalidation
---

# Implementing Next.js Data Access Layer (DAL)

## Overview

In the Vocare Next.js 16 + React 19 frontend, all communication with backend APIs and state synchronization is governed by a strict, type-safe Data Access Layer (DAL) located in `frontend/features/<module>/dal/`. The DAL eliminates runtime exceptions by using the functional Result pattern (`neverthrow`), enforces fine-grained cache revalidation via centralized tags (`lib/tags.ts`), guarantees single-source-of-truth schemas via `zod`, and streamlines Server Components with the `unwrap()` helper.

---

## When to Use

Use this skill when:
- Adding or modifying queries, mutations, or Server Actions for any frontend feature.
- Creating API client callers connecting to backend endpoints.
- Validating backend responses or client form inputs.
- Revalidating Next.js cache tags after data changes.
- Reading data inside React Server Components or Client Components.

When **NOT** to use:
- Backend C# code (use `handling-dotnet-domain-exceptions` or `scaffolding-vertical-slice`).
- Pure UI components that receive props and don't fetch data directly.

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"A simple `try/catch` throwing an `Error` is standard JavaScript and easier to write."* | Throwing uncaught errors in Server Actions or queries bypasses typed error handling, breaks functional pipelines, and leads to unhandled client crashes. Vocare mandates `neverthrow` (`Result<T, ApiError>`). |
| *"Calling `revalidatePath('/')` is safe and ensures everything stays up to date."* | `revalidatePath('/')` purges the entire application cache across all pages, severely degrading performance and causing unnecessary backend load. Always use targeted tag revalidation via `revalidateTag(TAG_NAME)`. |
| *"I'll declare an `interface UserDto` directly in TypeScript instead of Zod."* | Runtime data from external APIs can diverge from static TypeScript types. In Vocare, schemas in `schemas.ts` are defined in `zod` and types are derived via `z.infer<typeof Schema>`. |
| *"Wrapping queries in `React.cache()` is redundant if Next.js already fetches."* | In React 19 / Next.js 16 App Router, `React.cache()` deduplicates requests across component trees within the same render pass, preventing duplicate HTTP calls. |

---

## Red Flags - STOP and Fix

- `throw new Error(...)` or raw `try/catch` inside `dal/services.ts`, `dal/queries.ts`, or `dal/commands.ts`.
- Calling `revalidatePath` anywhere when a tag in `frontend/lib/tags.ts` exists.
- Writing manual `interface` definitions for API responses instead of `z.infer`.
- Fetching directly using `fetch(...)` instead of `apiClient` (`frontend/lib/api/api-client.ts`).
- Missing `React.cache()` around query functions in `queries.ts`.
- Manually handling `Unauthorized` in every Server Component instead of using `unwrap()`.

---

## DAL Directory Structure

Every feature module in `frontend/features/<module>/` contains a `dal/` directory:

```text
frontend/features/<module>/dal/
├── schemas.ts      # Zod validation schemas & derived TypeScript types
├── api.ts          # Configured ApiClient instance for the feature
├── services.ts     # Pure HTTP calls returning Result<T, DomainError>
├── queries.ts      # Cached server read operations (React.cache + next tags)
└── commands.ts     # Server Actions ('use server') for mutations + revalidateTag
```

---

## Step-by-Step Implementation Pattern

### 1. Define Schemas & Types (`schemas.ts`)
File: `frontend/features/<module>/dal/schemas.ts`

```typescript
import { z } from 'zod';

export const CvListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  targetPosition: z.string().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  lastModifiedAt: z.string(),
  version: z.number(),
  notes: z.string().nullable().optional(),
});

export const CvListResponseSchema = z.array(CvListItemSchema);

// Inferred TypeScript types - single source of truth
export type CvListItem = z.infer<typeof CvListItemSchema>;
export type CvListResponse = z.infer<typeof CvListResponseSchema>;
```

### 2. Configure the API Client (`api.ts`)
File: `frontend/features/<module>/dal/api.ts`

```typescript
import { createApiClient } from '@/lib/api/api-client';

// Points to the base path of the module controller
export const cvApiClient = createApiClient('/api/cvs');
```

### 3. Implement Domain Services (`services.ts`)
File: `frontend/features/<module>/dal/services.ts`

```typescript
import { Result } from 'neverthrow';
import { cvApiClient } from './api';
import { CvListItem, CvListResponseSchema } from './schemas';
import { ApiError } from '@/lib/api/api-client';
import { mapServiceError } from '@/lib/api/error-mapper';

export type CvDomainError = { type: 'CvNotFound'; message: string; details?: unknown };

export async function getUserCvsService(): Promise<Result<CvListItem[], ApiError>> {
  const result = await cvApiClient.get<CvListItem[]>('/my-cvs');

  return result.map((response) => {
    // Validate schema at runtime
    return CvListResponseSchema.parse(response.data);
  });
}
```

### 4. Implement Cached Queries (`queries.ts`)
File: `frontend/features/<module>/dal/queries.ts`

```typescript
import { cache } from 'react';
import { getUserCvsService } from './services';
import { CACHE_TAGS } from '@/lib/tags';

export const getUserCvsQuery = cache(async () => {
  const result = await getUserCvsService();
  return result;
});
```

### 5. Implement Server Actions with Tag Revalidation (`commands.ts`)
File: `frontend/features/<module>/dal/commands.ts`

```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/tags';
import { deleteCvService } from './services';
import { actionOk, actionErr, ActionResult } from '@/lib/types/result';

export async function deleteCvCommand(cvId: string): Promise<ActionResult<void>> {
  const result = await deleteCvService(cvId);

  return result.match(
    () => {
      // Precise tag invalidation - NEVER revalidatePath('/')
      revalidateTag(CACHE_TAGS.CV_LIST);
      return actionOk(undefined);
    },
    (error) => {
      return actionErr(error);
    }
  );
}
```

### 6. Reading in Server Components via `unwrap()`
File: `frontend/app/resume/page.tsx`

```tsx
import { getUserCvsQuery } from '@/features/resume/dal/queries';
import { unwrap } from '@/lib/utils/unwrap';
import { CvCardList } from '@/features/resume/components/CvCardList';

export default async function ResumePage() {
  // unwrap automatically handles global redirects (e.g. Unauthorized -> login)
  const cvs = await unwrap(getUserCvsQuery());

  return <CvCardList cvs={cvs} />;
}
```

---

## Quick Reference

| Responsibility | Location | Standard Tool / Convention |
| :--- | :--- | :--- |
| **Validation & Types** | `dal/schemas.ts` | `zod`, `z.infer` |
| **HTTP Transport** | `dal/api.ts` | `createApiClient(basePath)` |
| **Pure API Calls** | `dal/services.ts` | `neverthrow` (`Result<T, ApiError>`) |
| **Server Reads** | `dal/queries.ts` | `React.cache()`, Next.js fetch tags |
| **Server Mutations** | `dal/commands.ts` | `'use server'`, `revalidateTag(CACHE_TAGS.*)` |
| **Component unwrapping** | `app/**/page.tsx` | `unwrap(queryPromise)` |
| **Cache Tag Registry** | `frontend/lib/tags.ts` | Central enum `CACHE_TAGS` |
