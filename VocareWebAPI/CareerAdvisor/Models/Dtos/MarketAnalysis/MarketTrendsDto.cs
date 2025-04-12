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
        public string TrendName { get; set; }
        public string Description { get; set; }
        public string Impact { get; set; }
    }
}
