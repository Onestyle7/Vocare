using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.JobOffers.Exceptions
{
    public class JobOfferNotFoundException : NotFoundException
    {
        public Guid JobOfferId { get; }

        public JobOfferNotFoundException(Guid jobOfferId)
            : base($"No job offer with the ID: {jobOfferId} was found", "JOB_OFFER_NOT_FOUND")
        {
            JobOfferId = jobOfferId;
        }
    }
}
