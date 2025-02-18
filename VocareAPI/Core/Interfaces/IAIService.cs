using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareAPI.Core.Entities;

namespace VocareAPI.Core.Interfaces
{
    public interface IAIService
    {
        Task<UserProfile> ReturnCareerRecomendation(UserProfile userProfile); 
    }
}