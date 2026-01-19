using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface INoFluffJobsParser
    {
        Task<IEnumerable<JobOffer>> ParseFromUrlAsync(string url);
    }
}
