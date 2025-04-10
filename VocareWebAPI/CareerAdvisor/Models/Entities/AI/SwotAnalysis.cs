using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca analizę SWOT dla danej ścieżki zawodowej
    /// </summary>
    public class SwotAnalysis
    {
        [Key]
        public Guid Id { get; set; }
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public List<string> Opportunities { get; set; } = new();
        public List<string> Threats { get; set; } = new();
    }
}
