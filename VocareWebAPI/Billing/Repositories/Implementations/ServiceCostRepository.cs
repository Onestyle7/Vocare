using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.Billing.Repositories.Implementations
{
    public class ServiceCostRepository : IServiceCostRepository
    {
        private readonly AppDbContext _context;

        public ServiceCostRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetServiceCostAsync(string serviceName)
        {
            var serviceCost = await _context
                .ServiceCosts.Where(s =>
                    s.ServiceName.Equals(serviceName, StringComparison.OrdinalIgnoreCase)
                )
                .Select(s => s.TokenCost)
                .FirstOrDefaultAsync();

            if (serviceCost == 0) // Będzie problem z 0, jeśli wprowadzimy promocję na usługi za 0
            {
                throw new Exception($"Service cost for {serviceName} not found.");
            }
            else
                return serviceCost;
        }
    }
}
