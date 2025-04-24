using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models.Dtos;

namespace VocareWebAPI.CvGenerator.Services.Interfaces
{
    /// <summary>
    /// Interface serwisu do generowania CV.
    /// </summary>
    public interface ICvGenerationService
    {
        Task<CvDto> GenerateCvAsync(string userId, string? position);
    }
}
