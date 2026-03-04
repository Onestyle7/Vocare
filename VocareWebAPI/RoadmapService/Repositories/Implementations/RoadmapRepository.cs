using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;

namespace VocareWebAPI.RoadmapService.Repositories.Implementations
{
    public class RoadmapRepository : IRoadmapRepository
    {
        private readonly AppDbContext _context;

        public RoadmapRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Roadmap?> GetByIdAsync(Guid roadmapId)
        {
            var roadmap = await _context
                .Roadmaps.Include(r => r.Phases)
                .ThenInclude(p => p.Steps)
                .FirstOrDefaultAsync(r => r.Id == roadmapId);

            if (roadmap != null)
            {
                roadmap.Phases = roadmap.Phases.OrderBy(p => p.OrderIndex).ToList();
                foreach (var phase in roadmap.Phases)
                {
                    phase.Steps = phase.Steps.OrderBy(s => s.OrderIndex).ToList();
                }
            }
            return roadmap;
        }

        public async Task<List<Roadmap>> GetByUserIdAsync(string userId)
        {
            return await _context
                .Roadmaps.Where(r => r.UserId == userId && r.Status != RoadmapStatus.Archived)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Roadmap?> GetByCareerPathIdAsync(Guid careerPathId)
        {
            return await _context.Roadmaps.FirstOrDefaultAsync(r =>
                r.CareerPathId == careerPathId && r.Status != RoadmapStatus.Archived
            );
        }

        public async Task<int> CountActiveRoadmapsAsync(string userId)
        {
            return await _context.Roadmaps.CountAsync(r =>
                r.UserId == userId && r.Status != RoadmapStatus.Archived
            );
        }

        public async Task AddAsync(Roadmap roadmap)
        {
            await _context.Roadmaps.AddAsync(roadmap);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Roadmap roadmap)
        {
            _context.Roadmaps.Update(roadmap);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid roadmapId)
        {
            var roadmap = await _context.Roadmaps.FindAsync(roadmapId);
            if (roadmap != null)
            {
                roadmap.Status = RoadmapStatus.Archived; // soft delete
                await _context.SaveChangesAsync();
            }
        }
    }
}
