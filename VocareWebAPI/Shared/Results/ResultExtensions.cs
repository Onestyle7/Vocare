using Microsoft.AspNetCore.Mvc;

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
            else
            {
                var problemDetails = new ProblemDetails
                {
                    Title = "Business rule violation",
                    Detail = result.Error?.Message,
                    Status = 422,
                    Extensions = { ["errorCode"] = result.Error?.Code },
                };
                return new ObjectResult(problemDetails) { StatusCode = 422 };
            }
        }
    }
}
