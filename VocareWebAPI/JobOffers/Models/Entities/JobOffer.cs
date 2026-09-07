using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Models.Entities
{
    [Index(nameof(ReferenceNumber), nameof(Source), IsUnique = true)]
    public class JobOffer
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string ReferenceNumber { get; set; }
        public string Title { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string Url { get; set; } = "";
        public string? Country { get; set; }
        public SeniorityLevel SeniorityLevel { get; set; }
        public string JobType { get; set; } = ""; // Np. fulltime, 20 godzin tygodniowo itp
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public string BriefDescription { get; set; } = "";
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? SalaryCurrency { get; set; }
        public SalaryPeriod? SalaryPeriod { get; set; }
        public DateTime PublishedAt { get; set; }

        //Metadata
        public DateTime CreatedAt { get; set; } // kiedy dodaliśmy do naszej bazy danych
        public DateTime UpdatedAt { get; set; } // Ostatnia aktualizacja w bazie danych

        //Relacje
        public ICollection<JobOfferLocation> Locations { get; set; } = new List<JobOfferLocation>();
        public ICollection<JobOfferSkill> Skills { get; set; } = new List<JobOfferSkill>();
        public Vector? Embedding { get; set; }
        public JobOfferSource Source { get; set; } = JobOfferSource.NofluffJobs;
    }
}
