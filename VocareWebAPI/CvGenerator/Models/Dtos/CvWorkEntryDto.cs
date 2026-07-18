using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvWorkEntryDto
    {
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? StartDate { get; set; } // Format: YYYY-MM-DD
        public string? EndDate { get; set; } // Format: YYYY-MM-DD | "Present"
        [JsonPropertyName("responsibilities")]
        public List<string>? Responsibilities { get; set; }
        // kompatybilność wsteczna, do usunięcia gdy wszystkie CV z "description" formatem zostane ponownie wygenerowane
        [JsonInclude]
        [JsonPropertyName("description")]
        private string? Description
        {
            get;
            set
            {
                if(!string.IsNullOrWhiteSpace(value) && (Responsibilities is null or {Count: 0 }))
                {
                    Responsibilities = new List<string> {value};
                }
            }
        }
    }
}
