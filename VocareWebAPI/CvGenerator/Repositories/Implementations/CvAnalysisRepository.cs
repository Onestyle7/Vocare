using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.CvGenerator.Models.Entities;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.CvGenerator.Repositories.Implementations
{
    public class CvAnalysisRepository : ICvAnalysisRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CvAnalysisRepository> _logger;

        public CvAnalysisRepository(AppDbContext context, ILogger<CvAnalysisRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<CvAnalysis?> GetByCvIdAsync(Guid cvId)
        {
            return await _context.CvAnalyses.FirstOrDefaultAsync(ca => ca.CvId == cvId);
        }

        public async Task SaveAsync(CvAnalysis analysis)
        {
            var existAnalysis = await GetByCvIdAsync(analysis.CvId);

            if (existAnalysis == null)
            {
                _context.CvAnalyses.Add(analysis);
            }
            else
            {
                existAnalysis.ResultJson = analysis.ResultJson;
                existAnalysis.CvVersionAtAnalysis = analysis.CvVersionAtAnalysis;
                existAnalysis.AnalyzedAt = analysis.AnalyzedAt;
            }
            await _context.SaveChangesAsync();
        }
    }
}
