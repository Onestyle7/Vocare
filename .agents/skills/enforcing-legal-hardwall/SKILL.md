---
name: enforcing-legal-hardwall
description: Use when modifying authentication middleware, protected route policies, legal document acceptance flows, or handling 403 CONSENTS_REQUIRED responses
---

# Enforcing Legal Consents Hard Wall

## Overview

Vocare strictly complies with GDPR/RODO regulations via an architectural "Hard Wall" mechanism implemented in `LegalConsentsMiddleware.cs`. Any authenticated user whose token lacks `consents_valid: true` is immediately barred from accessing business APIs with HTTP 403 `CONSENTS_REQUIRED`. Access is restored only when the user accepts the latest terms via `POST /api/Legal/accept` and receives a freshly minted token with updated claims.

---

## When to Use

Use this skill when:
- Modifying authentication or authorization middleware in the .NET backend.
- Adding or versioning legal documents (Terms of Service, Privacy Policy).
- Implementing consent acceptance, verification, or audit logging.
- Handling HTTP 403 `CONSENTS_REQUIRED` responses in the Next.js frontend.
- Troubleshooting access denial for authenticated users.

When **NOT** to use:
- Non-legal feature flags or simple role-based authorization (e.g. Admin role).
- Marketing email opt-ins (which are voluntary and do not trigger the Hard Wall).

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"I will add my new controller route to the whitelist in `LegalConsentsMiddleware` so tests pass easily."* | Whitelisting business routes creates legal liabilities and violates privacy audits. Only authentication, legal acceptance, health checks, and swagger docs are permitted in the whitelist. |
| *"We can assume consents are valid by default and only check periodically in the background."* | GDPR requires active, verifiable consent before processing user data or storing AI inputs. The Hard Wall check is synchronous on every incoming request. |
| *"We can just return 200 OK from `POST /api/Legal/accept` without issuing a new token."* | The client's active token still contains `consents_valid: false`. Without issuing and storing the new encrypted token with `consents_valid: true`, subsequent requests will remain blocked by the middleware. |
| *"Audit data like IP and User-Agent are optional for consent records."* | Regulatory proof requires timestamp, client IP, User-Agent, and exact document version ID to prove valid consent. |

---

## Red Flags - STOP and Fix

- Adding any business path (e.g. `/api/cvs/*`, `/api/ai/*`, `/api/billing/*`) to `LegalConsentsMiddleware` allowed paths.
- Omitting the `consents_valid` claim when minting authentication tokens.
- Forgetting to return a new `accessToken` upon successful execution of `POST /api/Legal/accept`.
- Frontend ignoring 403 `CONSENTS_REQUIRED` instead of triggering the global legal modal.
- Failing to capture `HttpContext.Connection.RemoteIpAddress` and `User-Agent` headers during consent submission.

---

## Backend Hard Wall Architecture

### 1. The Strict Whitelist in Middleware
File: `VocareWebAPI/Legal/Middlewares/LegalConsentsMiddleware.cs`

```csharp
public class LegalConsentsMiddleware
{
    private readonly RequestDelegate _next;

    // ONLY these paths can bypass the Hard Wall when consents are invalid:
    private static readonly string[] AllowedPaths = new[]
    {
        "/api/legal",
        "/api/auth",
        "/health",
        "/swagger"
    };

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

        // Skip unauthenticated requests or explicitly whitelisted paths
        if (!context.User.Identity?.IsAuthenticated == true || AllowedPaths.Any(p => path.StartsWith(p)))
        {
            await _next(context);
            return;
        }

        // Check consents_valid claim
        var consentsValidClaim = context.User.FindFirst("consents_valid")?.Value;
        if (!bool.TryParse(consentsValidClaim, out var consentsValid) || !consentsValid)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Consents Required",
                Detail = "You must accept all required legal documents to continue.",
                Extensions = { ["errorCode"] = "CONSENTS_REQUIRED" }
            };

            await context.Response.WriteAsJsonAsync(problem);
            return;
        }

        await _next(context);
    }
}
```

### 2. Accepting Consents & Token Re-issue
File: `VocareWebAPI/Legal/Services/LegalService.cs`

```csharp
public async Task<LegalAcceptanceResultDto> AcceptConsentsAsync(
    string userId,
    List<Guid> documentIds,
    string clientIp,
    string userAgent
)
{
    foreach (var docId in documentIds)
    {
        await _legalRepository.RecordConsentAsync(new UserConsent
        {
            UserId = userId,
            DocumentId = docId,
            AcceptedAt = DateTime.UtcNow,
            IpAddress = clientIp,
            UserAgent = userAgent,
            ConsentSource = "WebUI_HardWall"
        });
    }

    // Verify all active required documents are now accepted
    var hasPending = await _legalRepository.HasPendingRequiredDocumentsAsync(userId);
    if (hasPending)
    {
        throw new BusinessRuleException("Not all mandatory documents have been accepted.", "MANDATORY_DOCUMENTS_PENDING");
    }

    // Re-issue encrypted token with consents_valid = true
    var newToken = _tokenService.GenerateToken(userId, consentsValid: true);

    return new LegalAcceptanceResultDto
    {
        Success = true,
        AccessToken = newToken
    };
}
```

---

## Frontend 403 Catch & Modal Flow

In `frontend/lib/api/api-client.ts`:

```typescript
// Central error interceptor
if (response.status === 403 && data?.errorCode === 'CONSENTS_REQUIRED') {
  // Emit event or update global state to open the blocking LegalConsentsModal
  legalModalEventEmitter.emit('open_required_consents');
}
```

When the user clicks "Akceptuję regulamin i politykę prywatności":
1. Client calls `POST /api/Legal/accept` with document IDs.
2. Response returns `{ accessToken: string }`.
3. Client updates cookie / auth store with new token.
4. Modal closes and original request is retried.

---

## Quick Reference

| Endpoint / Component | HTTP / Type | Responsibility |
| :--- | :--- | :--- |
| `GET /api/Legal/pending` | `[Authorize]` | Returns list of unaccepted mandatory documents |
| `POST /api/Legal/accept` | `[Authorize]` | Logs consents with IP/Agent and returns updated JWT |
| `GET /api/Legal/status` | `[Authorize]` | Fast boolean check of current consent validity |
| **Error Code** | `CONSENTS_REQUIRED` | HTTP 403 signal to trigger modal |
| **Claim Key** | `consents_valid` | Boolean claim in DataProtection token |
