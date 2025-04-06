using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    //To Dto słuzy do transfery danych między serwisem a API perplexity
    public class MarketAnalysisDetailsDto
    {
        public List<IndustryStatisticsDto> IndustryStatistics { get; set; }
        public List<SkillDemandDto> SkillDemand { get; set; }
        public List<MarketTrendsDto> MarketTrends { get; set; }
    }
}
