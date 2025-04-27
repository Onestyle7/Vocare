using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models
{
    /// <summary>
    /// Encja reprezentująca wygenerowane CV zapisane w bazie danych.
    /// </summary>
    public class GeneratedCv
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string CvJson { get; set; } = string.Empty;
        public string RawApiResponse { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}
