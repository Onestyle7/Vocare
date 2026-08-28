
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Models.Records
{
    public record JobStaleInfo(string ReferenceNumber, JobOfferSource Source, DateTime UpdatedAt);
}
