using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferDetailsService : IJobOfferDetailsService
    {
        private readonly IJobOfferRepository _repository;

        public JobOfferDetailsService(IJobOfferRepository repository)
        {
            _repository = repository;
        }

        public async Task<JobOfferDetailsDto> GetDetailsByIdAsync(Guid id)
        {
            var jobOffer = await _repository.GetDetailsByIdAsync(id);

            if (jobOffer is null)
                throw new JobOfferNotFoundException(id);

            return new JobOfferDetailsDto
            {
                Id = jobOffer.Id,
                Title = jobOffer.Title,
                CompanyName = jobOffer.CompanyName,
                Country = jobOffer.Country ?? string.Empty,
                Description = jobOffer.Description,
                Category = jobOffer.Category,
                Skills = [.. jobOffer.Skills.Select(s => s.Name)]
            };
        }
    }
}
