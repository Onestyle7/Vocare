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
            if (_webHostEnvironment.IsDevelopment())
            {
                await SendViaResendDev(to, subject, body);
            }
            else
            {
                await SendViaResend(to, subject, body);
            }
        }

        private async Task SendViaResendDev(string to, string subject, string body)
        {
            var testEmail = _configuration["Resend:TestEmail"] ?? "delivered@resend.dev";
            var devSubject = $"[DEV] {subject}";
            var devBody =
                $@"
--- DEVELOPMENT EMAIL ---
Original recipient: {to}
Original subject: {subject}
---

{body}";

            await SendViaResend(testEmail, devSubject, devBody);
            await SaveEmailToFile(to, subject, body);
        }

        private async Task SendViaResend(string to, string subject, string body)
        {
            // W produkcji użyj swojej domeny, w dev użyj testowej
            var fromEmail = _webHostEnvironment.IsProduction()
                ? _configuration["Resend:FromEmail"] ?? "noreply@vocare.pl"
                : _configuration["Resend:TestFromEmail"] ?? "onboarding@resend.dev";

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
                        "Email sending failed. Status: {StatusCode}, Response: {Response}",
                        response.StatusCode,
                        responseContent
                    );
                    throw new HttpRequestException($"Email sending failed: {responseContent}");
                }

                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", to);
                throw;
            }
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

{body}";

            await File.WriteAllTextAsync(filePath, content);
            _logger.LogInformation("Email saved to file: {FilePath}", filePath);
        }

        private string ConvertToHtml(string text)
        {
            // Prosta konwersja tekstu na HTML
            return text.Replace("\n", "<br>");
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
