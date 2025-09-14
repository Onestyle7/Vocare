using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.MarketNewsService.Models.Dtos;

namespace VocareWebAPI.MarketNewsService.Models.services.interfaces
{
    public interface IMarketNewsService
    {
        /// <summary>
        /// Pobiera 3 najnowsze newsy
        /// </summary>
        /// <returns>Lista 3 ostatnich newsów w formacie dto</returns>
        Task<List<MarketNewsListDto>> GetLatest3ForHomepageAsync();

        /// <summary>
        /// Pobiera najnowszy news dla popup na web
        /// </summary>
        /// <returns>Najnowszy news lub null</returns>
        Task<MarketNewsListDto?> GetLatestForPopupAsync();

        /// <summary>
        /// Pobiera wszystkie newsy z paginacją dla web blog
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        Task<MarketNewsPagedDto> GetAllForBlogAsync(int page, int pageSize);

        /// <summary>
        /// Pobiera szczegóły newsa po ID
        /// </summary>
        /// <param name="id"></param>
        /// <returns>Szczegóły newsa lub null jeśli nie znaleziono</returns>
        Task<MarketNewsDetailDto?> GetDetailAsync(Guid id);

        /// <summary>
        /// Główna metoda - generuje tygodniowy news za pomocą AI
        /// </summary>
        /// <returns>True jeśli news został wygenerowany, False jeśli już istnieje</returns>
        Task<bool> GenerateWeeklyNewsAsync();
    }
}
