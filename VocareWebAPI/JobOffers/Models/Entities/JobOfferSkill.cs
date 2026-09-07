using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Models.Entities
{
    public class JobOfferSkill
    {
        [Key]
        public Guid Id { get; set; }
        public Guid JobOfferId { get; set; }

        [ForeignKey("JobOfferId")]
        public JobOffer JobOffer { get; set; }

        [Required]
        public string Name { get; set; }
        public SkillLevel? Level { get; set; }
    }
}
