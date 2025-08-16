using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Repositories
{
    /// <summary>
    /// Interfejst repozytorium dla operacji na profilach użytkowników w bazie danych
    /// </summary>
    public interface IUserProfileRepository
    {
        /// <summary>
        /// Pobiera profil użytkownika na podstawie jego identyfikatora
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<UserProfile> GetUserProfileByIdAsync(string userId);

        /// <summary>
        /// Aktualizuje profil użytkownika w bazie danych
        /// </summary>
        /// <param name="profile">Profil użytkownika do zaktualizowania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        Task UpdateUserProfileAsync(UserProfile profile);
    }
}
