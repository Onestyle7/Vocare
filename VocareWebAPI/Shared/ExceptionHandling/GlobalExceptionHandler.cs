using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Shared.ExceptionHandling
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken
        )
        {
            var (status, title) = exception switch
            {
                NotFoundException => (404, "Not Found"),
                ForbiddenException => (403, "Forbidden"),
                ConflictException => (409, "Conflict"),
                BusinessRuleException => (422, "Unprocessable Entity"),
                StripeException => (502, "Payment Provider Error"),
                _ => (500, "Internal Server Error"),
            };

            string errorCode = exception switch
            {
                DomainException de => de.ErrorCode,
                StripeException => "PAYMENT_PROVIDER_ERROR",
                _ => "INTERNAL_ERROR",
            };

            string traceId = httpContext.TraceIdentifier;
            string detail = exception switch
            {
                DomainException de => de.Message,
                StripeException =>
                    "An error occurred with payment provider. Please try again later",
                _ => "An unexpected error occurred. Please try again later.",
            };

            var problem = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = detail,
                Extensions = { ["errorCode"] = errorCode, ["traceId"] = traceId },
            };

            _logger.LogError(
                exception,
                "Unhandled {ExceptionType} mapped to status {Status} with code {ErrorCode}, traceId {TraceId}",
                exception.GetType().Name,
                status,
                errorCode,
                traceId
            );

            httpContext.Response.StatusCode = status;
            httpContext.Response.ContentType = "application/problem+json";

            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }
    }
}
