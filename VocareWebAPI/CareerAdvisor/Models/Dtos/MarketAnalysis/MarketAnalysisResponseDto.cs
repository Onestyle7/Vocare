using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące odpowiedź z analizy rynku, używany do transferu danych między serwisem a API.
    /// </summary>
    public class MarketAnalysisResponseDto
    {
        public MarketAnalysisDetailsDto MarketAnalysis { get; set; } =
            new MarketAnalysisDetailsDto();
    }
}
