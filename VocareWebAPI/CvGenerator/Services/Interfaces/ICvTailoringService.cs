using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models.Dtos;

namespace VocareWebAPI.CvGenerator.Repositories.Interfaces
{
    public interface ICvTailoringService
    {
        Task<CvDetailsDto> TailorCvAsync(TailorCvDto dto, string userId);
        Task<CvDetailsDto> GenerateCvFromProfileAsync(GenerateCvFromProfileDto dto, string userId);
    }
}
