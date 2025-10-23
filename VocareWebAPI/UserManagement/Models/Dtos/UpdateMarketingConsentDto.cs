using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class UpdateMarketingConsentDto
    {
        [Required(ErrorMessage = "AcceptConsent is required.")]
        public bool AcceptConsent { get; set; }
    }
}
