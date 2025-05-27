using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Interfaces;

namespace VocareWebAPI.UserManagement
{
    public class UserRegistrationHandler
    {
        private readonly IUserSetupService _userSetupService;
        private readonly ILogger<UserRegistrationHandler> _logger;

        public UserRegistrationHandler(
            IUserSetupService userSetupService,
            ILogger<UserRegistrationHandler> logger
        )
        {
            _userSetupService = userSetupService;
            _logger = logger;
        }

        public async Task HandleUserRegistrationAsync(string userId)
        {
            _logger.LogInformation("Handling user registration for: {UserId}", userId);
            await _userSetupService.SetupNewUserAsync(userId);
        }
    }
}
