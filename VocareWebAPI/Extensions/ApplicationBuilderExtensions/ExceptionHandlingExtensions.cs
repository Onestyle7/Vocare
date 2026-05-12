namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class ExceptionHandlingExtensions
    {
        public static WebApplication UseGlobalExceptionHandling(this WebApplication app)
        {
            app.UseExceptionHandler();

            return app;
        }
    }
}
