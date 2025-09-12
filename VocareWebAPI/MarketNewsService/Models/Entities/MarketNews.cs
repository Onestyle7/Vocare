using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace VocareWebAPI.MarketNewsService.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca newsy rynkowe.
    /// </summary>
    public class MarketNews
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Title { get; set; } = String.Empty;

        [Required]
        [MaxLength(3000)]
        public string Content { get; set; } = String.Empty;

        [Required]
        [MaxLength(150)]
        public string Summary { get; set; } = String.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
