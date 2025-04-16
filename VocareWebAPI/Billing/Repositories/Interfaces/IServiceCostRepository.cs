using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Repositories.Interfaces
{
    public interface IServiceCostRepository
    {
        Task<int> GetServiceCostAsync(string serviceName);
    }
}
