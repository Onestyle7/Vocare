using System.ComponentModel.DataAnnotations;
using VocareWebAPI.Legal.Models.Enums;

namespace VocareWebAPI.Legal.Models.Dtos
{
    public class RecordCookieConsentRequestDto : IValidatableObject
    {
        [Required]
        public bool? AnalyticsGranted { get; set; }

        [Required]
        public bool? AdsGranted { get; set; }

        [Required, EnumDataType(typeof(CookieConsentSource))]
        public CookieConsentSource? Source { get; set; }

        [Required, MaxLength(32)]
        public string TextVersion { get; set; } = "";
        public Guid ConsentId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
        {
            if (ConsentId == Guid.Empty)
                yield return new ValidationResult("ConsentId is required.", [nameof(ConsentId)]);
        }
    }
}
