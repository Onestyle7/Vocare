---
name: metering-service-tokens
description: Use when implementing or modifying backend services, controllers, or workflows that consume paid AI operations, token balances, or Stripe billing integrations
---

# Metering Service Tokens & Billing Gating

## Overview

Vocare operates a hybrid monetization model combining recurring Stripe subscriptions with a consumable token balance. All resource-intensive AI operations (profile analysis, market analysis, CV generation, CV tailoring, and CV quality auditing) are metered. Services must enforce a strict two-phase billing protocol: **verify access before execution** and **deduct tokens only upon successful completion**.

---

## When to Use

Use this skill when:
- Creating or updating any endpoint that invokes external AI models (OpenAI, Perplexity).
- Integrating new billable features or adjusting service pricing.
- Managing user token balances or recording token ledger entries.
- Handling Stripe webhook events, checkout sessions, or customer portal redirects.

When **NOT** to use:
- Free endpoints (fetching cached recommendations, reading user profile, downloading saved CVs).
- Pure frontend presentation of billing components (unless handling `INSUFFICIENT_TOKENS` error redirects).

---

## Token Pricing Registry

Token costs are stored in the `ServiceCosts` database table. Never hardcode token values in application code:

| Service Name Constant | Standard Cost | Description |
| :--- | :--- | :--- |
| `AnalyzeProfile` | 60 tokens | Deep career assessment & path generation |
| `MarketAnalysis` | 50 tokens | Live market trends and narrator evaluation |
| `GenerateCvFromProfile` | 20 tokens | Full CV creation from user profile data |
| `TailorCv` | 20 tokens | Customizing CV against a specific job posting |
| `AnalyzeCv` | 10 tokens | 8-section CV quality audit & improvement plan |

---

## Rationalization Table

| Excuse / Rationalization | Reality in Vocare Architecture |
| :--- | :--- |
| *"I'll deduct tokens before the AI call to ensure payment is captured."* | External AI calls can timeout or fail (HTTP 502/504). Deducting beforehand unjustly drains user tokens for failed requests. |
| *"I'll execute the AI call first and check token balance afterwards."* | Malicious or depleted accounts can exhaust expensive third-party OpenAI/Perplexity credits for free. |
| *"Hardcoding `cost = 10` in C# is faster than querying `ServiceCosts`."* | Marketing packages and pricing change dynamically. Hardcoded values cause billing discrepancies between database records and runtime behavior. |
| *"I can catch the error and not log the transaction."* | Every single token addition or deduction must create an immutable record in `TokenTransactions` for financial auditing. |

---

## Red Flags - STOP and Fix

- Calling `_openAiService` or `_perplexityService` without first calling `await _billingService.CanAccessServiceAsync(userId, serviceName)`.
- Deducting tokens inside a `finally` block or before the AI result is safely generated.
- Catching `InsufficientTokensException` and returning a generic 400 Bad Request instead of letting it bubble as HTTP 422 `INSUFFICIENT_TOKENS`.
- Processing Stripe webhooks without validating `Stripe-Signature` against `StripeSettings.WebhookSecret`.
- Failing to verify idempotency on payment events, allowing duplicate token top-ups.

---

## Two-Phase Metering Pattern

In any billable service in `VocareWebAPI/<Module>/Services/Implementations/`:

```csharp
public async Task<CvAnalysisResultDto> AnalyzeCvAsync(Guid cvId, string userId)
{
    const string serviceName = "AnalyzeCv";

    // PHASE 1: Access verification (Pre-flight check)
    // Throws InsufficientTokensException (422) or InActiveSubscriptionException if balance is inadequate
    var canAccess = await _billingService.CanAccessServiceAsync(userId, serviceName);
    if (!canAccess)
    {
        throw new InsufficientTokensException(userId, 0, 10);
    }

    // Retrieve CV data
    var cv = await _cvRepository.GetByIdAsync(cvId);
    if (cv == null || cv.UserId != userId)
        throw new CvNotFoundException(cvId);

    // AI Execution (External call protected by Polly retry policies)
    CvAnalysisResultDto analysisResult;
    try
    {
        analysisResult = await _openAiService.AnalyzeCvContentAsync(cv.CvJson, cv.TargetPosition);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "AI analysis failed for CV {CvId}. Tokens NOT deducted.", cvId);
        throw new AiServiceException("Failed to analyze CV with AI provider.", ex);
    }

    // Persist result to database
    await _cvAnalysisRepository.SaveAnalysisAsync(cvId, analysisResult);

    // PHASE 2: Token deduction (Post-execution capture)
    // Deducts tokens and records TokenTransaction entry in PostgreSQL
    await _billingService.DeductTokensForServiceAsync(userId, serviceName);

    return analysisResult;
}
```

---

## Stripe Webhook Security Pattern

File: `VocareWebAPI/Billing/Controllers/BillingController.cs`

```csharp
[HttpPost("webhook")]
[AllowAnonymous]
[EnableRateLimiting("WebhookPolicy")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    var signatureHeader = Request.Headers["Stripe-Signature"];

    Event stripeEvent;
    try
    {
        stripeEvent = EventUtility.ConstructEvent(
            json,
            signatureHeader,
            _stripeSettings.WebhookSecret
        );
    }
    catch (StripeException ex)
    {
        _logger.LogWarning(ex, "Stripe webhook signature validation failed.");
        return BadRequest();
    }

    // Handle events idempotently:
    switch (stripeEvent.Type)
    {
        case Events.CheckoutSessionCompleted:
            var session = stripeEvent.Data.Object as Session;
            await _billingService.HandleCheckoutSessionCompletedAsync(session!);
            break;

        case Events.CustomerSubscriptionUpdated:
        case Events.CustomerSubscriptionDeleted:
            var subscription = stripeEvent.Data.Object as Subscription;
            await _billingService.HandleSubscriptionUpdatedAsync(subscription!);
            break;
    }

    return Ok();
}
```

---

## Quick Reference

| Operation | Method to Call | Expected Outcome |
| :--- | :--- | :--- |
| **Verify Gating** | `_billingService.CanAccessServiceAsync(userId, serviceName)` | Returns `bool` or throws `InsufficientTokensException` |
| **Capture Fee** | `_billingService.DeductTokensForServiceAsync(userId, serviceName)` | Decrements `TokenBalance`, logs `TokenTransaction` |
| **Check Balance** | `_billingService.GetUserAccessStatusAsync(userId)` | Returns `TokenBalance` & `SubscriptionStatus` |
| **Stripe Checkout** | `_billingService.CreateCheckoutSessionAsync(userId, priceId)` | Returns Stripe session URL |
| **Customer Portal** | `_billingService.CreateCustomerPortalSessionAsync(userId)` | Returns Stripe Customer Portal URL |
