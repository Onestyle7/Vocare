using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.CvGenerator.Models
{
    /// <summary>
    /// Encja reprezentująca wygenerowane CV zapisane w bazie danych.
    /// </summary>
    public class GeneratedCv
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Relacja do usera
        /// </summary>

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = default!;

        /// <summary>
        /// Nazwa CV, domyślnie "Moje CV".
        /// Może być używana do identyfikacji lub wyboru CV przez użytkownika
        /// np. "Software Engineer", "Data Scientist" itp.
        /// </summary>

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = "Moje CV";

        /// <summary>
        /// Opcjonalne stanowisko, dla któego zostało przygotowane CV
        /// </summary>
        public string? TargetPosition { get; set; }

        /// <summary>
        /// Czy CV jest aktywne
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Czy CV jest domyślne dla użytkownika
        /// </summary>
        public bool IsDefault { get; set; } = false;

        /// <summary>
        /// Zawartość CV w formacie JSON.
        /// </summary>
        public string CvJson { get; set; } = string.Empty;

        /// <summary>
        /// Data utworzenia CV.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Data ostatniej modyfikacji CV.
        /// </summary>
        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Wersja CV
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Opcjonalne notatki dotyczące CV.
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }
    }
}
