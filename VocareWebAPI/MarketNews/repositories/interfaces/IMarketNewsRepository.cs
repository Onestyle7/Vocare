using VocareWebAPI.MarketNews.Models.Entities;

namespace VocareWebAPI.MarketNews.Repositories.Interfaces
{
    public interface IMarketNewsRepository
    {
        /// <summary>
        /// pobiera 3 najnowsze newsy (dla mobile home page)
        /// </summary>
        /// <returns>Lista 3 ostatnich newsów</returns>
        Task<List<MarketNewsEntity>> GetLatest3Async();

        /// <summary>
        /// Pobiera najnowszy news(dla powiadomień)
        /// </summary>
        /// <returns>Najnowszy news lub null</returns>
        Task<MarketNewsEntity?> GetLatestAsync();

        /// <summary>
        /// Pobiera wszystkie newsy z paginacją
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <returns>Lista newsów + total count</returns>
        Task<(List<MarketNewsEntity> news, int totalCount)> GetAllPagedAsync(
            int page,
            int pageSize
        );

        /// <summary>
        /// Pobiera news po ID (Dla szczegółów)
        /// </summary>
        /// <param name="id">ID newsa</param>
        /// <returns>Najnowszy news lub null</returns>
        Task<MarketNewsEntity?> GetByIdAsync(Guid id);

        /// <summary>
        /// Dodaje nowy news do bazy (po wygenerowaniu przez AI)
        /// </summary>
        /// <param name="marketNews">News do dodania</param>
        /// <returns>Dodany news</returns>
        Task<MarketNewsEntity> AddAsync(MarketNewsEntity marketNews);

        /// <summary>
        /// Sprawdza czy istnieje już news z danego dnia (zabezpieczenie przed duplikatami)
        /// </summary>
        /// <param name="date">Data do sprawdzenia</param>
        /// <returns>True jeśli news z tej daty już istnieje</returns>
        Task<bool> ExistsForDateAsync(DateTime date);
    }
}
