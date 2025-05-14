using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja kolejnego kroku w realizacji rekomendacji zawodowej
    /// </summary>
    public class NextStep
    {
        [Key]
        public Guid Id { get; set; }
        public string Step { get; set; } = String.Empty; // Opis kolejnego kroku, np. "Zapisz się na kurs programowania w Pythonie"
    }
}
