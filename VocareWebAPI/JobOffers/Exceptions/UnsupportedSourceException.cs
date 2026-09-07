<<<<<<< HEAD
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Exceptions
{
    public class UnsupportedSourceException : InvalidOperationException
    {
        public JobOfferSource Source { get; }

        public UnsupportedSourceException(JobOfferSource source)
            : base($"The source '{source}' is not supported.")
        {
            Source = source;
        }
    }
}
=======
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Exceptions
{
    public class UnsupportedSourceException : InvalidOperationException
    {
        public JobOfferSource Source { get; }

        public UnsupportedSourceException(JobOfferSource source)
            : base($"The source '{source}' is not supported.")
        {
            Source = source;
        }
    }
}
>>>>>>> staging
