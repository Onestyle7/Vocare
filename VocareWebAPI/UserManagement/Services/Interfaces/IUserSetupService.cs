using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Interfaces
{
    public interface IUserSetupService
    {
        Task SetupNewUserAsync(string userId);
    }
}
