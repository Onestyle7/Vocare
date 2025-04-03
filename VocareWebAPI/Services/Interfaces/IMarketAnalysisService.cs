using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    public interface IMarketAnalysisService
    {
        Task<MarketAnalysisResponseDto> GetMarketAnalysisAsync(string userId);
    }
}
