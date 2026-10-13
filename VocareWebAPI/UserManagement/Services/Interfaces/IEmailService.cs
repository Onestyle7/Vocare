using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Dtos;

namespace VocareWebAPI.UserManagement.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);

        Task SendEmailAsync(
            string to,
            string subject,
            string body,
            IReadOnlyCollection<EmailAttachment> attachments
        );
    }
}
