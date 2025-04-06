using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    public interface ICareerStatisticsRepository
    {
        Task AddAsync(CareerStatistics entity);
    }
}
