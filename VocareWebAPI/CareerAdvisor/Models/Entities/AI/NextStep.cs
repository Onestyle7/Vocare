
using System.ComponentModel.DataAnnotations;


namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja kolejnego kroku w realizacji rekomendacji zawodowej
    /// </summary>
    public class NextStep
    {
        [Key]
        public Guid Id { get; set; }
        public string Step { get; set; } = String.Empty;
    }
}
