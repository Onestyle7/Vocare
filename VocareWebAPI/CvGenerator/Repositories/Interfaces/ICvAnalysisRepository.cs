using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models.Entities;

namespace VocareWebAPI.CvGenerator.Repositories.Interfaces
{
    public interface ICvAnalysisRepository
    {
        Task<CvAnalysis?> GetByCvIdAsync(Guid cvId);
        Task SaveAsync(CvAnalysis analysis);
    }
}
