using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Models.Entities;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Fabryki mocków dla typów ASP.NET Core Identity (<see cref="UserManager{TUser}"/>,
    /// <see cref="SignInManager{TUser}"/>) — konstruktory tych klas wymagają wielu zależności,
    /// które w testach jednostkowych nie są używane.
    /// </summary>
    public static class IdentityMocks
    {
        public static Mock<UserManager<User>> UserManager()
        {
            var store = new Mock<IUserStore<User>>();
            var options = new Mock<IOptions<IdentityOptions>>();
            options.Setup(o => o.Value).Returns(new IdentityOptions());

            var manager = new Mock<UserManager<User>>(
                store.Object,
                options.Object,
                new PasswordHasher<User>(),
                Array.Empty<IUserValidator<User>>(),
                Array.Empty<IPasswordValidator<User>>(),
                new UpperInvariantLookupNormalizer(),
                new IdentityErrorDescriber(),
                null!,
                NullLogger<UserManager<User>>.Instance
            )
            {
                CallBase = true,
            };
            return manager;
        }

        public static Mock<SignInManager<User>> SignInManager(Mock<UserManager<User>> userManager)
        {
            var contextAccessor = new Mock<IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
            var options = new Mock<IOptions<IdentityOptions>>();
            options.Setup(o => o.Value).Returns(new IdentityOptions());

            return new Mock<SignInManager<User>>(
                userManager.Object,
                contextAccessor.Object,
                claimsFactory.Object,
                options.Object,
                NullLogger<SignInManager<User>>.Instance,
                new Mock<IAuthenticationSchemeProvider>().Object,
                new Mock<IUserConfirmation<User>>().Object
            )
            {
                CallBase = false,
            };
        }
    }
}
