using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models;

namespace VocareWebAPI.CvGenerator.Repositories.Interfaces
{
    public interface IGeneratedCvRepository
    {
        Task AddAsync(GeneratedCv generatedCv);
    }
}
