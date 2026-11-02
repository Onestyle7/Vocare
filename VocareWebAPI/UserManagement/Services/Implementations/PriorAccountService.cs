using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations;

public class PriorAccountService(
    UserManager<User> userManager,
    IEmailHashService emailHashService,
    IAccountAntiAbuseReporitory antiAbuseRepository
) : IPriorAccountService
{
    private readonly UserManager<User> _userManager = userManager;
    private readonly IEmailHashService _emailHashService = emailHashService;
    private readonly IAccountAntiAbuseReporitory _antiAbuseRepository = antiAbuseRepository;

    public async Task<AccountAntiAbuseRegistry?> GetPriorAccountAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (string.IsNullOrWhiteSpace(user?.Email))
            return null;

        var emailHash = _emailHashService.ComputeHash(user.Email);
        var registry = await _antiAbuseRepository.GetByEmailHashAsync(emailHash);

        // Rejestr może wskazywać bieżące konto dopiero po jego usunięciu – wtedy to nie jest
        // „wcześniejsze” konto
        return registry is null || registry.UserId == userId ? null : registry;
    }
}
