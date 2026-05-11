using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Services.Implementations
{
    public class RoadmapPhaseService : IRoadmapPhaseService
    {
        private readonly AppDbContext _context;

        public RoadmapPhaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RoadmapPhase> UpdateNameAsync(Guid phaseId, string userId, string newName)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("Użytkownik nie może być pusty");

            var phase = await _context
                .RoadmapPhases.Include(p => p.Roadmap)
                .FirstOrDefaultAsync(p => p.Id == phaseId);

            if (phase == null)
                throw new RoadmapPhaseNotFoundException(phaseId);

            if (phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(phaseId, userId);

            phase.Title = newName;
            await _context.SaveChangesAsync();
            return phase;
        }

        public async Task DeletePhaseAsync(Guid phaseId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("Użytkownik nie może być pusty");

            var phase = await _context
                .RoadmapPhases.Include(p => p.Roadmap)
                .FirstOrDefaultAsync(p => p.Id == phaseId);

            if (phase == null)
                throw new RoadmapPhaseNotFoundException(phaseId);

            if (phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(phaseId, userId);

            _context.RoadmapPhases.Remove(phase);
            await _context.SaveChangesAsync();
        }
    }
}
