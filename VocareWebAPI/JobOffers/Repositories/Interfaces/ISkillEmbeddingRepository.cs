using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Repositories.Interfaces
{
    public interface ISkillEmbeddingRepository
    {
        Task<SkillEmbedding?> GetByNormalizedNameAsync(string normalizedName);
        Task<List<SkillEmbedding>> GetByNormalizedNamesAsync(List<string> normalizedNames);
        Task AddAsync(SkillEmbedding skillEmbedding);
        Task AddRangeAsync(List<SkillEmbedding> skillEmbeddings);
        Task<List<string>> GetAllNormalizedNamesAsync();
    }
}
