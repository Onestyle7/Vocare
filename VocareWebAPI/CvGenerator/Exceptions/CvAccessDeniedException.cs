using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CvGenerator.Exceptions
{
    public class CvAccessDeniedException : NotFoundException
    {
        public Guid CvId { get; }

        public CvAccessDeniedException(Guid cvId)
            : base($"Cv with id {cvId} not found.", "CV_NOT_FOUND") // celowo zwracam 404, żeby nie ujawniać istnienia Cv, do którego użytkownik nie ma dostępu
        {
            CvId = cvId;
        }
    }
}
