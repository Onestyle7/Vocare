using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Data;

public class ServiceCostRepository : IServiceCostRepository
{
    private readonly AppDbContext _context;

    public ServiceCostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetServiceCostAsync(string serviceName)
    {
        if (string.IsNullOrWhiteSpace(serviceName))
            throw new ArgumentException(
                "Service name cannot be null or empty.",
                nameof(serviceName)
            );

        // Używamy ILIKE w PostgreSQL do case‑insensitive porównania
        var costEntry = await _context.ServiceCosts.FirstOrDefaultAsync(sc =>
            EF.Functions.ILike(sc.ServiceName, serviceName)
        );

        if (costEntry is null)
            throw new KeyNotFoundException($"Service cost for \"{serviceName}\" not found.");

        return costEntry.TokenCost;
    }
}
