using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly HttpClient _httpClient;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IWebHostEnvironment webHostEnvironment,
            IHttpClientFactory httpClientFactory
        )
        {
            _configuration = configuration;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;

            var apiKey = _configuration["Resend:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Resend API key not configured");
            }

            _httpClient = httpClientFactory.CreateClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            _httpClient.BaseAddress = new Uri("https://api.resend.com/");
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            // Sprawdź czy powinniśmy używać testowego emaila
            var useTestEmail = ShouldUseTestEmail();

            if (useTestEmail)
            {
                await SendToTestEmail(to, subject, body);
            }
            else
            {
                // Na produkcji ZAWSZE wysyłaj na prawdziwy adres
                await SendViaResend(to, subject, body);
            }
        }

        private bool ShouldUseTestEmail()
        {
            // Najpierw sprawdź czy jest to development
            if (_webHostEnvironment.IsDevelopment())
            {
                return true;
            }

            // Następnie sprawdź czy jest ustawiona flaga w konfiguracji
            // To pozwala na testowanie emaili nawet na staging
            var useTestEmailConfig = _configuration.GetValue<bool?>("Resend:UseTestEmail");
            if (useTestEmailConfig.HasValue)
            {
                return useTestEmailConfig.Value;
            }

            // Domyślnie na produkcji NIE używaj testowego emaila
            return false;
        }

        private async Task SendToTestEmail(string originalTo, string subject, string body)
        {
            var testEmail = _configuration["Resend:TestEmail"] ?? "delivered@resend.dev";
            var envName = _webHostEnvironment.EnvironmentName;
            var modifiedSubject = $"[{envName.ToUpper()}] {subject}";
            var modifiedBody =
                $@"
--- {envName.ToUpper()} TEST EMAIL ---
Original recipient: {originalTo}
Original subject: {subject}
Environment: {envName}
---

{body}";

            await SendViaResend(testEmail, modifiedSubject, modifiedBody);

            // Zapisz do pliku tylko w development
            if (_webHostEnvironment.IsDevelopment())
            {
                await SaveEmailToFile(originalTo, subject, body);
            }
        }

        private async Task SendViaResend(string to, string subject, string body)
        {
            // Określ adres nadawcy na podstawie środowiska
            var fromEmail = GetFromEmail();
            var fromName = _configuration["Resend:FromName"] ?? "Vocare Team";

            var payload = new
            {
                from = $"{fromName} <{fromEmail}>",
                to = new[] { to },
                subject = subject,
                html = ConvertToHtml(body),
                text = StripHtml(body),
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync("emails", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "Email sending failed. Status: {StatusCode}, Response: {Response}, To: {To}",
                        response.StatusCode,
                        responseContent,
                        to
                    );
                    throw new HttpRequestException($"Email sending failed: {responseContent}");
                }

                _logger.LogInformation(
                    "Email sent successfully to {Email} in {Environment} environment",
                    to,
                    _webHostEnvironment.EnvironmentName
                );
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", to);
                throw;
            }
        }

        private string GetFromEmail()
        {
            // W produkcji zawsze używaj prawdziwej domeny
            if (_webHostEnvironment.IsProduction())
            {
                return _configuration["Resend:FromEmail"] ?? "noreply@vocare.pl";
            }

            // W innych środowiskach możesz użyć testowej domeny
            return _configuration["Resend:TestFromEmail"] ?? "onboarding@resend.dev";
        }

        private async Task SaveEmailToFile(string to, string subject, string body)
        {
            var emailsDir = Path.Combine(_webHostEnvironment.ContentRootPath, "DevEmails");
            Directory.CreateDirectory(emailsDir);

            var fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{SanitizeFileName(to)}.txt";
            var filePath = Path.Combine(emailsDir, fileName);

            var content =
                $@"To: {to}
Subject: {subject}
Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
Environment: {_webHostEnvironment.EnvironmentName}

{body}";

            await File.WriteAllTextAsync(filePath, content);
            _logger.LogInformation("Email saved to file: {FilePath}", filePath);
        }

        private string ConvertToHtml(string text)
        {
            // Prosta konwersja tekstu na HTML
            var html = System.Security.SecurityElement.Escape(text);
            return html.Replace("\n", "<br>");
        }

        private string StripHtml(string html)
        {
            return Regex.Replace(html, "<.*?>", string.Empty);
        }

        private string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            return string.Join(
                "_",
                fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries)
            );
        }
    }
}
