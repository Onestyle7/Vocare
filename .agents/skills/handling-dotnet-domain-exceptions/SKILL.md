---
name: handling-dotnet-domain-exceptions
description: Use when creating domain exceptions, validating business rules, handling service errors, or returning failure responses in the .NET backend
---

# Handling .NET Domain Exceptions

## Overview

In the Vocare .NET 9 WebAPI backend, all business rule violations and error states are modeled as strongly-typed domain exceptions that bubble up to a central `GlobalExceptionHandler` (`IExceptionHandler`). Controllers must **never** catch exceptions to return ad-hoc error payloads; instead, exceptions are automatically transformed into RFC 7807 `ProblemDetails` (`application/problem+json`) with an explicit `errorCode` and `traceId`.

---

## When to Use

Use this skill when:
- Creating new domain-specific error types in any vertical slice (`Billing`, `CvGenerator`, `CareerAdvisor`, `UserManagement`, etc.).
- Enforcing business invariants or domain validation inside service implementations.
- Mapping entity states (e.g. not found, already active, access denied, token shortage) to appropriate client responses.
- Handling failures from external providers (Stripe, OpenAI, Perplexity).

When **NOT** to use:
- Frontend error handling in Next.js (use `implementing-nextjs-dal` and `neverthrow`).
- Trivial syntax/format validation handled automatically by ASP.NET Core `[ApiController]` model binding (data annotations).

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"A `try-catch` block in the controller is safer because it prevents unhandled 500 errors."* | `GlobalExceptionHandler` catches all unhandled exceptions, logs them with `traceId`, and outputs standard `ProblemDetails`. Controller `try-catch` destroys consistent error shaping and hides errors from logging. |
| *"Throwing standard `Exception` or `InvalidOperationException` is simpler."* | Standard .NET exceptions default to HTTP 500 with `INTERNAL_ERROR`. Business violations must return 400/403/404/409/422 with a structured, machine-readable `errorCode`. |
| *"Inheriting directly from `DomainException` is enough since it's a domain error."* | `GlobalExceptionHandler` pattern-matches on intermediate HTTP base classes (`NotFoundException`, `BusinessRuleException`, etc.). A direct child of `DomainException` defaults to HTTP 500! |
| *"I don't need a specific `errorCode` string; the message is self-explanatory."* | The frontend Data Access Layer relies strictly on `extensions.errorCode` to trigger UI states (e.g., redirecting to checkout on `INSUFFICIENT_TOKENS` or opening consent modals). |

---

## Red Flags - STOP and Fix

- `try { ... } catch (Exception ex) { return BadRequest(new { error = ex.Message }); }` inside any controller.
- `throw new Exception("...")` or `throw new InvalidOperationException("...")` inside domain services.
- Creating an exception class that directly inherits from `System.Exception` or `VocareWebAPI.Shared.Exceptions.DomainException`.
- Missing uppercase snake_case `errorCode` in the constructor.
- Returning custom anonymous objects for failure responses instead of `ProblemDetails` or `result.ToActionResult()`.

---

## The Exception Hierarchy

All domain exceptions live in `VocareWebAPI/<ModuleName>/Exceptions/` and must inherit from one of the core base classes in `VocareWebAPI.Shared.Exceptions`:

```text
DomainException (abstract, requires message & errorCode)
├── NotFoundException           -> HTTP 404 (Not Found)
├── ForbiddenException          -> HTTP 403 (Forbidden)
├── ConflictException           -> HTTP 409 (Conflict)
├── BusinessRuleException       -> HTTP 422 (Unprocessable Entity)
└── AiServiceException          -> HTTP 502 (Bad Gateway / AI Service Error)
```

Additionally, `StripeException` is caught by `GlobalExceptionHandler` and mapped to **HTTP 502** with `errorCode: "PAYMENT_PROVIDER_ERROR"`.

---

## Quick Reference

| Desired HTTP Status | Base Class to Inherit From | Title in ProblemDetails | Example Domain Use Case |
| :--- | :--- | :--- | :--- |
| **404 Not Found** | `NotFoundException` | `Not Found` | `CvNotFoundException`, `ServiceCostNotFoundException` |
| **403 Forbidden** | `ForbiddenException` | `Forbidden` | `CvAccessDeniedException` *(note: use 404 if existence shouldn't leak)* |
| **409 Conflict** | `ConflictException` | `Conflict` | `SubscriptionAlreadyActiveException`, `UserBillingAlreadyExistsException` |
| **422 Unprocessable** | `BusinessRuleException` | `Unprocessable Entity`| `InsufficientTokensException`, `SubscriptionAlreadyCanceledException` |
| **502 Bad Gateway** | `AiServiceException` | `AI service Error` | Failures communicating with OpenAI or Perplexity API |

---

## Implementation Guide

### 1. Defining a Domain Exception
File: `VocareWebAPI/<ModuleName>/Exceptions/<Feature>Exception.cs`

```csharp
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class InsufficientTokensException : BusinessRuleException
    {
        public string UserId { get; }
        public int CurrentBalance { get; }
        public int RequiredTokens { get; }

        public InsufficientTokensException(string userId, int currentBalance, int requiredTokens)
            : base(
                $"User {userId} does not have enough tokens. Current: {currentBalance}, required: {requiredTokens}.",
                "INSUFFICIENT_TOKENS"
            )
        {
            UserId = userId;
            CurrentBalance = currentBalance;
            RequiredTokens = requiredTokens;
        }
    }
}
```

### 2. Throwing in the Service
File: `VocareWebAPI/<ModuleName>/Services/Implementations/<Feature>Service.cs`

```csharp
public async Task DeductTokensForServiceAsync(string userId, string serviceName)
{
    var billing = await _userBillingRepository.GetByUserIdAsync(userId);
    if (billing == null)
        throw new UserBillingNotFoundException(userId);

    var serviceCost = await _serviceCostRepository.GetByNameAsync(serviceName);
    if (serviceCost == null)
        throw new ServiceCostNotFoundException(serviceName);

    if (billing.TokenBalance < serviceCost.Cost)
    {
        throw new InsufficientTokensException(userId, billing.TokenBalance, serviceCost.Cost);
    }

    // Proceed with deduction...
}
```

### 3. Clean Controller (No try/catch)
File: `VocareWebAPI/<ModuleName>/Controllers/<Feature>Controller.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost("deduct")]
    public async Task<IActionResult> DeductTokens([FromBody] DeductTokensRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // DO NOT wrap in try-catch! Any domain exception automatically
        // bubbles to GlobalExceptionHandler and returns RFC 7807 ProblemDetails.
        await _billingService.DeductTokensForServiceAsync(userId, dto.ServiceName);

        return NoContent();
    }
}
```

### 4. Working with `Result<T>` in Services
When a service explicitly returns `Result<T>` (defined in `VocareWebAPI.Shared.Results`):

```csharp
// In Controller:
[HttpPost("custom-action")]
public async Task<ActionResult<MyDto>> CustomAction([FromBody] MyRequestDto dto)
{
    Result<MyDto> result = await _myService.ExecuteAsync(dto);

    // Converts Result.Fail to ObjectResult with ProblemDetails matching the status code
    if (!result.IsSuccess)
    {
        return result.ToActionResult();
    }

    return Ok(result.Value);
}
```

---

## Common Mistakes & Solutions

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| Returning `BadRequest(new { error = "..." })` in controller | Breaks JSON schema; frontend cannot find `errorCode` or `detail` | Let exception bubble up or return `result.ToActionResult()` |
| `public class MyError : DomainException` | Status code evaluates to 500 instead of 400/404/422 | Inherit from `NotFoundException`, `BusinessRuleException`, etc. |
| Using lowercase or spaced error codes (e.g. `"not found"`) | Frontend enums fail to match | Always use uppercase snake_case (e.g. `"CV_NOT_FOUND"`) |
| Revealing resource existence to unauthorized users | Information disclosure security vulnerability | Follow `CvAccessDeniedException`: throw `NotFoundException` (404) rather than 403 when a user tries to access another user's private entity |
