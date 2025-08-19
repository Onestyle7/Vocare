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
        private readonly HttpClient _httpClient;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IHttpClientFactory httpClientFactory
        )
        {
            _configuration = configuration;
            _logger = logger;

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
            await SendViaResend(to, subject, body);
        }

        private async Task SendViaResend(string to, string subject, string body)
        {
            var fromEmail = _configuration["Resend:FromEmail"] ?? "noreply@vocare.pl";
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

                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", to);
                throw;
            }
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
    }
}
