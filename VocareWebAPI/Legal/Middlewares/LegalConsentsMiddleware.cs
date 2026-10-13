using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VocareWebAPI.Legal.Middlewares
{
    /// <summary>
    /// Middleware implementing the Hard Wall mechanism:
    /// Logged-in users with the flag `consents_valid != true` have access only to the `/api/legal/*` and `/api/auth/*` endpoints.
    /// Any attempts to call other business endpoints are blocked with an HTTP 403 Forbidden response and the `CONSENTS_REQUIRED` code.
    /// </summary>
    public class LegalConsentsMiddleware(RequestDelegate next, ILogger<LegalConsentsMiddleware> logger)
    {
        private readonly RequestDelegate _next = next;
        private readonly ILogger<LegalConsentsMiddleware> _logger = logger;

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                await _next(context);
                return;
            }

            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            // allowed paths for user with invalid consents
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
            if (path.StartsWith("/api/legal") || path.StartsWith("/api/auth") || path.StartsWith("/health") || path.StartsWith("/swagger"))
            {
                await _next(context);
                return;
            }

            // claim consents_valid verification
            var consentsValidClaim = context.User.FindFirst("consents_valid")?.Value;
            var isConsentsValid = string.Equals(consentsValidClaim, "true", StringComparison.OrdinalIgnoreCase);

            if (!isConsentsValid)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
                _logger.LogWarning("Blocking request to {Path} for user {UserId} due to pending legal consents.", path, userId);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/problem+json";

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Forbidden",
                    Detail = "Active legal consents must be accepted before accessing application resources.",
                    Extensions =
                    {
                        ["errorCode"] = "CONSENTS_REQUIRED",
                        ["traceId"] = context.TraceIdentifier
                    }
                };

                await context.Response.WriteAsJsonAsync(problem);
                return;
            }

            await _next(context);
        }
    }
}
