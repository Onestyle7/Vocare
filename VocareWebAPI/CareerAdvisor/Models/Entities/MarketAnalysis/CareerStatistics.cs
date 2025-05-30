using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    /// <summary>
    /// Encja reprezentująca statystyki dla konkretnej ścieżki zawodowej w ramach analizy rynku
    /// </summary>
    public class CareerStatistics
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; } = String.Empty; // Nazwa ścieżki zawodowej, np. "Programista Python"
        public decimal AverageSalaryMin { get; set; }
        public decimal AverageSalaryMax { get; set; }
        public int EmploymentRate { get; set; }
        public string GrowthForecast { get; set; } = String.Empty; // Prognoza wzrostu zatrudnienia
        public DateTime LastUpdated { get; set; }
        public Guid AiRecommendationId { get; set; } // Klucz obcy do AiRecommendation
        //asdaghjv
    }
}
