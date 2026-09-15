using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.MarketNews.Models.Dtos
{
    public class MarketPulseListItemDto
    {
        public string Slug { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public DateTime PublishedAt { get; set; }
    }
}
