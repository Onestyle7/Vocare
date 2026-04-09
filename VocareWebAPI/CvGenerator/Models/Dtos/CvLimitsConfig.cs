using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvLimitsConfig
    {
        public const string SectionName = "CvLimits";

        [Range(1, int.MaxValue, ErrorMessage = "Free tier limit must be at least 1")]
        public int FreeTierLimit { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Premium tier limit must be at least 1")]
        public int PremiumTierLimit { get; set; }
    }
}
