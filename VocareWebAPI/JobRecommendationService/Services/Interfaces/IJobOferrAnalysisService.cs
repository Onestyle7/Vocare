using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Services.Interfaces
{
    public interface IJobOfferAnalysisService
    {
        Task AnalyzeSalaryAsync(List<string> salaryData);
        Task PrepareJobOfferAnalysisAsync();
        Task GiveJobOffer();
    }
}
