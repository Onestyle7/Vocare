using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.Shared.Results;

namespace VocareWebAPI.CvGenerator.Interfaces
{
    public interface ICvTailoringService
    {
        Task<CvDetailsDto> TailorCvAsync(TailorCvDto dto, string userId);
        Task<Result<CvDetailsDto>> GenerateCvFromProfileAsync(
            GenerateCvFromProfileDto dto,
            string userId
        );
    }
}
