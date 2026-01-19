using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IJobOfferSyncService
    {
        Task<SyncResult> SyncOffersAsync();
        Task<int> CleanupStaleOffersAsync();
    }

    public class SyncResult
    {
        public int Added { get; set; }
        public int Updated { get; set; }
        public int Failed { get; set; }
        public int Total { get; set; }
    }
}
