using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvLimitsConfig
    {
        public const string SectionName = "CvLimits";
        public int FreeTierLimit { get; set; } = 3;
        public int PremiumTierLimit { get; set; } = 25;
    }
}
