using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.CareerAdvisor.Repositories.Interfaces
{
    public interface ICareerPathRepository
    {
        Task<CareerPath?> GetByIdAsync(Guid id);
    }
}
