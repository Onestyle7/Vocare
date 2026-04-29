using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CvGenerator.Exceptions
{
    public class CvAnalysisNotFoundException : NotFoundException
    {
        public Guid CvId { get; }

        public CvAnalysisNotFoundException(Guid cvId)
            : base($"Analysis for CV {cvId} not found.", "CV_ANALYSIS_NOT_FOUND")
        {
            CvId = cvId;
        }
    }
}
