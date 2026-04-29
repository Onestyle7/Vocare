using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Resend;
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
                _ => (500, "Internal Server Error"),
            };

            string errorCode = exception is DomainException domainException
                ? domainException.ErrorCode
                : "INTERNAL_ERROR";

            string traceId = httpContext.TraceIdentifier;
            string detail =
                exception is DomainException ? exception.Message : "An unexpected error occurred.";

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

            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }
    }
}
