using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces
{
    public interface ICvParseHistoryRepository
    {
        Task<int> CountByUserIdAsync(string userId);
        Task CreateAsync(CvParseHistory history);
    }
}
