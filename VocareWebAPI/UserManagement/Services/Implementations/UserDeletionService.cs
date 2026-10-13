using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Stripe;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Enums;
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
            return Result<bool>.Fail(new Error("USER_NOT_FOUND", $"User {userId} not found", 404));
        }

        if (await userManager.HasPasswordAsync(user))
        {
            if (
                string.IsNullOrWhiteSpace(password)
                || !await userManager.CheckPasswordAsync(user, password)
            )
            {
                return Result<bool>.Fail(new Error("INVALID_PASSWORD", "Invalid password", 400));
            }
        }

        if (user.Email is null)
            return Result<bool>.Fail(
                new Error("USER_EMAIL_IS_EMPTY", $"Email for user {userId} is empty", 400)
            );

        try
        {
            var userBilling = await userBillingRepository.GetByUserIdAsync(userId);
            // The subscription.deleted webhook keeps StripeSubscriptionId, so the status
            // decides whether there is still anything to cancel in Stripe.
            if (
                !string.IsNullOrEmpty(userBilling.StripeSubscriptionId)
                && userBilling.SubscriptionStatus != SubscriptionStatus.Canceled
            )
            {
                try
                {
                    var subscriptionService = new Stripe.SubscriptionService();
                    await subscriptionService.CancelAsync(userBilling.StripeSubscriptionId);
                }
                catch (StripeException ex)
                {
                    logger.LogError(
                        "Message: {message}, source: {source}, trace: {trace}",
                        ex.Message,
                        ex.Source,
                        ex.StackTrace
                    );
                    return Result<bool>.Fail(
                        new Error(
                            "STRIPE_ERROR",
                            $"Failed to cancel existing stripe subscripition for {userId}",
                            502
                        )
                    );
                }
                catch (Exception ex)
                {
                    logger.LogError(
                        "Message: {message}, source: {source}, trace: {trace}",
                        ex.Message,
                        ex.Source,
                        ex.StackTrace
                    );
                    return Result<bool>.Fail(
                        new Error(
                            "SERVER_ERROR",
                            $"Failed to cancel existing stripe subscripition for {userId}",
                            500
                        )
                    );
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
