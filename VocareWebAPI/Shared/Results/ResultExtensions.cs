using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace VocareWebAPI.Shared.Results
{
    public static class ResultExtensions
    {
        public static ActionResult<T> ToActionResult<T>(this Result<T> result)
        {
            if (result.IsSuccess)
            {
                return new OkObjectResult(result.Value);
            }

            var statusCode = result.Error?.StatusCode ?? 422;

            var problemDetails = new ProblemDetails
            {
                Title =
                    statusCode == 422
                        ? "Busines rule violation"
                        : ReasonPhrases.GetReasonPhrase(statusCode),
                Detail = result.Error?.Message,
                Status = statusCode,
                Extensions = { ["errorCode"] = result.Error?.Code },
            };
            return new ObjectResult(problemDetails) { StatusCode = statusCode };
        }
    }
}
