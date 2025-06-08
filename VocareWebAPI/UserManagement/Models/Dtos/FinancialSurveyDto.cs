using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class FinancialSurveyDto
    {
        /// <summary>
        /// Aktualne zarobki użytkownika (np. miesięczne) – optional
        /// </summary>
        public decimal? CurrentSalary { get; set; }

        /// <summary>
        /// Oczekiwane zarobki użytkownika (np. miesięczne) – optional
        /// </summary>
        public decimal? DesiredSalary { get; set; }

        /// <summary>
        /// Czy użytkownik posiada zobowiązania (np. kredyt)?
        /// </summary>
        public bool HasLoans { get; set; }

        /// <summary>
        /// Szczegóły dotyczące zobowiązań (jeśli HasLoans = true)
        /// </summary>
        public string? LoanDetails { get; set; }

        /// <summary>
        /// Poziom chęci podejmowania ryzyka
        /// </summary>
        public Risk RiskAppetite { get; set; } = Risk.Unknown;

        /// <summary>
        /// Czy użytkownik jest skłonny do relokacji w celach zawodowych?
        /// </summary>
        public bool WillingToRelocate { get; set; }
    }
}
