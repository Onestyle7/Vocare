using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SendGrid;
using SendGrid.Helpers.Mail;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IWebHostEnvironment webHostEnvironment
        )
        {
            _configuration = configuration;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            if (_webHostEnvironment.IsDevelopment())
            {
                // Na DEV - SendGrid z prefixem [DEV]
                await SendViaSendGridDev(to, subject, body);
            }
            else
            {
                // Na PROD - normalny SendGrid
                await SendViaSendGridDev(to, subject, body);
            }
        }

        private async Task SendViaSendGridDev(string to, string subject, string body)
        {
            var testEmail = _configuration["SendGrid:TestEmail"] ?? "dev@vocare.pl";

            var devSubject = $"[DEV] {subject}";

            var devBody =
                $@"
--- DEV EMAIL ---
Original recipient: {to}
-----------------

{body}";

            // Wyślij na adres testowy
            await SendViaSendGrid(testEmail, devSubject, devBody);

            // Dodatkowo zapisz do pliku dla debugowania
            await SaveEmailToFile(to, subject, body);
        }

        private async Task SaveEmailToFile(string to, string subject, string body)
        {
            var emailsDir = Path.Combine(_webHostEnvironment.ContentRootPath, "DevEmails");
            Directory.CreateDirectory(emailsDir);

            var fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{to.Replace("@", "_at_")}.txt";
            var filePath = Path.Combine(emailsDir, fileName);

            var content =
                $@"
To: {to}
Subject: {subject}
Date: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
-------------------

{body}
";

            await File.WriteAllTextAsync(filePath, content);
            _logger.LogInformation("Email saved to file: {FilePath}", filePath);
        }

        private async Task SendViaSendGrid(string to, string subject, string body)
        {
            var apiKey = _configuration["SendGrid:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("SendGrid API key not configured");
                throw new InvalidOperationException("Email service not configured");
            }

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(
                _configuration["SendGrid:FromEmail"],
                _configuration["SendGrid:FromName"]
            );
            var toAddress = new EmailAddress(to);

            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, body, body);

            try
            {
                var response = await client.SendEmailAsync(msg);

                if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogError("SendGrid failed with status: {Status}", response.StatusCode);
                    throw new Exception("Failed to send email");
                }

                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", to);
                throw;
            }
        }
    }
}
