using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    //To Dto słuzy do transfery danych między serwisem a API
    public class MarketAnalysisResponseDto
    {
        public MarketAnalysisDetailsDto MarketAnalysis { get; set; }
    }
}
