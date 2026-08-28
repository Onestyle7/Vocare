using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Models.Entities;

namespace VocareWebAPI.CvGenerator.Services.Interfaces
{
    public interface ICvAnalysisService
    {
        Task<CvAnalysisResultDto> AnalyzeCvAsync(Guid cvId, string userId);
        Task<CvAnalysisResultDto> GetAnalysisAsync(Guid cvId, string userId);
    }
}
