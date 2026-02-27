using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface ISkillEmbeddingService
    {
        Task<Dictionary<string, float[]>> GetEmbeddingsForSkillsAsync(List<string> skills);
        string NormalizeSkillName(string skill);
        Task<SkillBackfillResult> BackfillSkillEmbeddingsAsync();
    }

    public class SkillBackfillResult
    {
        public int TotalSkillsFound { get; set; }
        public int UniqueSkillsAfterNormalization { get; set; }
        public int AlreadyCached { get; set; }
        public int NewlyGenerated { get; set; }
        public List<string> SampleNewSkills { get; set; } = new();
    }
}
