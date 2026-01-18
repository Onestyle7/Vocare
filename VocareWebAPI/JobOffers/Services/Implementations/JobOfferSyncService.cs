using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferSyncService : IJobOfferSyncService
    {
        private readonly IJobOfferRepository _repository;
        private readonly INoFluffJobsParser _parser;
        private readonly ILogger<JobOfferSyncService> _logger;
        private const string FeedUrl = "https://nofluffjobs.com/api/xml/jooble";

        public JobOfferSyncService(
            IJobOfferRepository repository,
            INoFluffJobsParser parser,
            ILogger<JobOfferSyncService> logger
        )
        {
            _repository = repository;
            _parser = parser;
            _logger = logger;
        }
    }
}
