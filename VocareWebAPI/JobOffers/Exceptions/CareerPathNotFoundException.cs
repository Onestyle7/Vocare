using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.JobOffers.Exceptions
{
    public class CareerPathNotFoundException : NotFoundException
    {
        public Guid CareerPathId { get; }

        public CareerPathNotFoundException(Guid careerPathId)
            : base($"No career path with the ID: {careerPathId} was found", "CAREER_PATH_NOT_FOUND")
        {
            CareerPathId = careerPathId;
        }
    }
}
