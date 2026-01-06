using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories
{
    public class CvParseHistoryRepository : ICvParseHistoryRepository
    {
        private readonly AppDbContext _context;

        public CvParseHistoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> CountByUserIdAsync(string userId)
        {
            return await _context.CvParseHistories.CountAsync(h => h.UserId == userId);
        }

        public async Task CreateAsync(CvParseHistory history)
        {
            _context.CvParseHistories.Add(history);
            await _context.SaveChangesAsync();
        }
    }
}
