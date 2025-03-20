using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    public interface IAiService
    {
        Task<string> GetCareerRecommendationsAsync(UserProfile profile);
    }
}
