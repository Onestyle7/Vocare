using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Repositories.Interfaces
{
    public interface IAiNarratorRepository
    {
        Task AddAsync(AiNarrator entity);
        Task<AiNarrator?> GetByCareerStatisticsIdAsync(Guid careerStatisticsId);
        Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId);
    }
}
