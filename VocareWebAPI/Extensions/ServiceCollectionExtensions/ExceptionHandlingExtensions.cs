using Microsoft.AspNetCore.Diagnostics;
using VocareWebAPI.Shared.ExceptionHandling;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class ExceptionHandlingExtensions
    {
        public static IServiceCollection AddGlobalExceptionHandling(
            this IServiceCollection services
        )
        {
            services.AddExceptionHandler<GlobalExceptionHandler>();
            services.AddProblemDetails();

            return services;
        }
    }
}
