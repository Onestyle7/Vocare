using VocareWebAPI.JobOffers.Models.Dtos;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IJobOfferDetailsService
    {
        Task<JobOfferDetailsDto> GetDetailsByIdAsync(Guid id);
    }
}
