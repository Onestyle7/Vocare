using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Entities
{
    public class JobOfferLocation
    {
        [Key]
        public Guid Id { get; set; }

        public Guid JobOfferId { get; set; }

        [ForeignKey("JobOfferId")]
        public JobOffer JobOffer { get; set; } = default!;
        public string City { get; set; } = "";
        public bool IsRemote { get; set; }
    }
}
