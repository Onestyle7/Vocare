using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Shared.Results;
using VocareWebAPI.UserManagement.Repositories.Implementations;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations;

public class UserDeletionService(
    UserManager<User> userManager,
    IUserDataCleanupRepository userDataCleanupRepository,
    IUserBillingRepository userBillingRepository,
    IEmailHashService emailHashService,
    ILogger<UserDeletionService> logger
) : IUserDeletionService
{

    public async Task<Result<bool>> DeleteCurrentUserAsync(string userId, string? password = null)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || user.IsDeleted)
        {
            return Result<bool>.Fail(
                new Error("USER_NOT_FOUND", $"User {userId} not found", 404)
            );
        }

        if (await userManager.HasPasswordAsync(user))
        {
            if (string.IsNullOrWhiteSpace(password) || !await userManager.CheckPasswordAsync(user, password))
            {
                return Result<bool>.Fail(
                    new Error("INVALID_PASSWORD", "Invalid password", 400)
                );
            }
        }

        if (user.Email is null)
            return Result<bool>.Fail(
                new Error("USER_EMAIL_IS_EMPTY", $"Email for user {userId} is empty", 400)
            );

        try
        {
            var userBilling = await userBillingRepository.GetByUserIdAsync(userId);
            if (!string.IsNullOrEmpty(userBilling.StripeSubscriptionId))
            {
                try
                {
                    var subscriptionService = new Stripe.SubscriptionService();
                    await subscriptionService.CancelAsync(userBilling.StripeSubscriptionId);
                }
                catch
                {
                    return Result<bool>.Fail(new Error(
                        "STRIPE_ERROR",
                        $"Failed to cancel existing stripe subscripition for {userId}",
                        502
                    ));
                }
            }
        }
        catch (UserBillingNotFoundException) { }

        var emailHash = emailHashService.ComputeHash(user.Email);
        AnonimizeUserData(user);
        await userDataCleanupRepository.PurgeUserDataAsync(user, emailHash);

        return Result<bool>.Ok(true);
    }

    private void AnonimizeUserData(User user)
    {
        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.Email = $"deleted_{Guid.NewGuid()}@deleted.vocare.pl";
        user.NormalizedEmail = user.Email.ToUpperInvariant();
        user.UserName = $"deleted_{Guid.NewGuid()}";
        user.NormalizedUserName = user.UserName.ToUpperInvariant();
        user.PasswordHash = null;
        user.SecurityStamp = Guid.NewGuid().ToString();
    }
}
