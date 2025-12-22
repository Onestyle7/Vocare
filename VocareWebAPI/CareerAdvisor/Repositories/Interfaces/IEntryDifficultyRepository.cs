using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Repositories.Interfaces
{
    public interface IEntryDifficultyRepository
    {
        Task AddAsync(EntryDifficulty entity);
        Task<EntryDifficulty?> GetByCareerStatisticsIdAsync(Guid careerStatisticsId);
        Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId);
    }
}
