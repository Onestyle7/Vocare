using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    public class JobOfferDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string Country { get; set; } = "";
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public ICollection<string> Skills { get; set; } = new List<string>();
        public bool IsActive { get; set; }
    }
}
