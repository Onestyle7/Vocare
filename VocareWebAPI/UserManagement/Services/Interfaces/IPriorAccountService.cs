using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Services.Interfaces;

/// <summary>
/// Dane z usuniętego wcześniej konta o tym samym adresie e-mail (po hashu). Pozwala przyznawać
/// trial i rabat za zgodę raz na osobę, a nie raz na konto.
/// </summary>
public interface IPriorAccountService
{
    /// <summary>Wpis z rejestru anti-abuse albo null, gdy na ten e-mail nie było konta.</summary>
    Task<AccountAntiAbuseRegistry?> GetPriorAccountAsync(string userId);
}
