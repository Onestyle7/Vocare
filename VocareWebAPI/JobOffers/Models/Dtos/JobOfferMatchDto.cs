using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    /// <summary>
    /// Dto reprezentujące ofertę pracy dopasowana do sciezki kariery
    /// </summary>
    public class JobOfferMatchDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string Url { get; set; } = "";
        public string Category { get; set; } = "";
        public string SeniorityLevel { get; set; } = "";
        public string BriefDescription { get; set; } = "";
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? SalaryCurrency { get; set; }
        public List<string> Locations { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public DateTime PublishedAt { get; set; }
    }
}
