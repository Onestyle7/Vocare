using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące trend rynkowy
    /// </summary>
    public class MarketTrendsDto
    {
        public string TrendName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
    }
}
