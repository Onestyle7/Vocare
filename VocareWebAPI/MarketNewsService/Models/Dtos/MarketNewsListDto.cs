using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.MarketNewsService.Models.Dtos
{
    /// <summary>
    /// Dto dla szczegółów newsa
    /// </summary>
    public class MarketNewsListDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = String.Empty;
        public string Summary { get; set; } = String.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
