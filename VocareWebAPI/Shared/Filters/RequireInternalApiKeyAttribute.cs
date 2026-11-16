using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.Shared.Filters
{
    public sealed class RequireInternalApiKeyAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var provider =
                context.HttpContext.RequestServices.GetRequiredService<IClientInfoProvider>();
            if (!provider.HasValidInternalApiKey())
                context.Result = new UnauthorizedResult();
        }
    }
}
