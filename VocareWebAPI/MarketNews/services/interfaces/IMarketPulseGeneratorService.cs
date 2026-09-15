namespace VocareWebAPI.MarketNews.services.interfaces
{
    public interface IMarketPulseGeneratorService
    {
        Task<bool> GenerateAsync();
    }
}
