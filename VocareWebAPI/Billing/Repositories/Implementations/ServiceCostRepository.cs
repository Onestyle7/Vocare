using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
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

        // Sprawdzamy typ providera bazy danych
        var isInMemory = _context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";

        ServiceCost? costEntry;

        if (isInMemory)
        {
            // Dla InMemory używamy ToLower() - działa tylko z prostymi case'ami
            costEntry = await _context.ServiceCosts.FirstOrDefaultAsync(sc =>
                sc.ServiceName.ToLower() == serviceName.ToLower()
            );
        }
        else
        {
            // Dla PostgreSQL używamy ILike dla prawdziwego case-insensitive porównania
            costEntry = await _context.ServiceCosts.FirstOrDefaultAsync(sc =>
                EF.Functions.ILike(sc.ServiceName, serviceName)
            );
        }

        if (costEntry is null)
            throw new KeyNotFoundException($"Service cost for \"{serviceName}\" not found.");

        return costEntry.TokenCost;
    }
}
