using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;

namespace VocareWebAPI.JobOffers.Repositories.Implementations
{
    public class SkillEmbeddingRepository : ISkillEmbeddingRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SkillEmbeddingRepository> _logger;

        public SkillEmbeddingRepository(
            AppDbContext context,
            ILogger<SkillEmbeddingRepository> logger
        )
        {
            _context = context;
            _logger = logger;
        }

        public async Task<SkillEmbedding?> GetByNormalizedNameAsync(string normalizedName)
        {
            return await _context.SkillEmbeddings.FirstOrDefaultAsync(n =>
                n.NormalizedSkillName == normalizedName
            );
        }

        public async Task<List<SkillEmbedding>> GetByNormalizedNamesAsync(
            List<string> normalizedNames
        )
        {
            return await _context
                .SkillEmbeddings.Where(n => normalizedNames.Contains(n.NormalizedSkillName))
                .ToListAsync();
        }

        public async Task AddAsync(SkillEmbedding skillEmbedding)
        {
            await _context.SkillEmbeddings.AddAsync(skillEmbedding);
            await _context.SaveChangesAsync();
        }

        public async Task AddRangeAsync(List<SkillEmbedding> skillEmbeddings)
        {
            await _context.SkillEmbeddings.AddRangeAsync(skillEmbeddings);
            await _context.SaveChangesAsync();
        }

        public async Task<List<string>> GetAllNormalizedNamesAsync()
        {
            return await _context.SkillEmbeddings.Select(n => n.NormalizedSkillName).ToListAsync();
        }
    }
}
