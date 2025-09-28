namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class SecurityHeadersExtensions
    {
        public static WebApplication UseSecurityHeaders(this WebApplication app)
        {
            app.Use(
                async (context, next) =>
                {
                    if (!context.Response.HasStarted)
                    {
                        context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
                        context.Response.Headers.TryAdd("X-Frame-Options", "SAMEORIGIN");
                        context.Response.Headers.TryAdd(
                            "Referrer-Policy",
                            "strict-origin-when-cross-origin"
                        );

                        if (app.Environment.IsDevelopment())
                        {
                            context.Response.Headers.TryAdd(
                                "Content-Security-Policy",
                                "default-src 'self'; "
                                    + "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; "
                                    + "style-src 'self' 'unsafe-inline'; "
                                    + "img-src 'self' data: https: blob:; "
                                    + "connect-src 'self' https://api.stripe.com ws://localhost:* http://localhost:*;"
                            );
                        }
                        else
                        {
                            // Restrykcyjne dla staging/produkcji
                            context.Response.Headers.TryAdd(
                                "Content-Security-Policy",
                                "default-src 'self'; "
                                    + "script-src 'self' https://js.stripe.com; "
                                    + "style-src 'self' 'unsafe-inline'; "
                                    + "img-src 'self' data: https:; "
                                    + "font-src 'self' data:; "
                                    + "connect-src 'self' https://api.stripe.com https://*.vocare.pl;"
                            );
                        }

                        if (app.Environment.IsProduction())
                        {
                            context.Response.Headers.TryAdd(
                                "Strict-Transport-Security",
                                "max-age=31536000; includeSubDomains"
                            );
                        }
                    }
                    await next();
                }
            );
            return app;
        }
    }
}
