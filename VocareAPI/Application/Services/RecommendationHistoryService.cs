using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VocareAPI.Application.DTOs;
using VocareAPI.Application.Services.Interfaces;
using VocareAPI.Core.Entities;
using VocareAPI.Core.Interfaces.Persistence;

namespace VocareAPI.Application.Services
{
    public class RecommendationHistoryService : IRecommendationHistoryService
    {
        private readonly VocareDbContext _context;
        private readonly IMapper _mapper;

        public RecommendationHistoryService(VocareDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task SaveRecommendationAsync(Guid userId, string recommendationText)
        {
            var recommendation = new RecommendationHistory
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RecommendationText = recommendationText,
                GeneratedAt = DateTime.UtcNow
            }; 
             
            _context.RecommendationHistories.Add(recommendation);
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<RecommendationHistoryDto>> GetRecommendationsForUserAsync(Guid userId)
        {
            var history = await _context.RecommendationHistories
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.GeneratedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<RecommendationHistoryDto>>(history);
        }
    }
}