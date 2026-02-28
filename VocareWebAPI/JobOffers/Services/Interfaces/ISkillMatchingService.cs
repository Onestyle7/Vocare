using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface ISkillMatchingService
    {
        Task<SkillMatchResult> CalculateSkillMatchAsync(
            List<string> requiredSkills,
            List<string> offerSkills
        );
    }

    public class SkillMatchResult
    {
        public double Score { get; set; }
        public int MatchedCount { get; set; }
        public int TotalRequired { get; set; }
        public Dictionary<string, SkillMatchDetail> FullMatches { get; set; } = new();

        public Dictionary<string, SkillMatchDetail> PartialMatches { get; set; } = new();

        public List<string> MissingSkills { get; set; } = new();
    }

    public class SkillMatchDetail
    {
        public string MatchedSkill { get; set; } = "";
        public double Similarity { get; set; }
    }
}
