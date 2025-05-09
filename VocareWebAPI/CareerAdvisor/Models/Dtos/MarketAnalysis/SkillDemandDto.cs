using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące zapotrzebowanie na konkretną umiejętność, używamy do transferu danych między serwisem a api perplexity
    /// </summary>
    public class SkillDemandDto
    {
        public string Skill { get; set; } = string.Empty;
        public string DemandLevel { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
    }
}
