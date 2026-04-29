using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CvGenerator.Exceptions
{
    public class CvNotFoundException : NotFoundException
    {
        public Guid CvId { get; }

        public CvNotFoundException(Guid cvId)
            : base($"Cv with id {cvId} not found.", "CV_NOT_FOUND")
        {
            CvId = cvId;
        }
    }
}
