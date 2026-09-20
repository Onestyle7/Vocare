using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Pomocnicze rozszerzenia do konfiguracji kontekstu HTTP kontrolerów w testach jednostkowych.
    /// </summary>
    public static class ControllerTestExtensions
    {
        /// <summary>
        /// Ustawia zalogowanego użytkownika (claim <see cref="ClaimTypes.NameIdentifier"/>) oraz
        /// pusty kontekst żądania, dzięki czemu <c>User.FindFirst(...)</c> zwraca oczekiwaną wartość.
        /// </summary>
        public static TController WithUser<TController>(
            this TController controller,
            string userId,
            params string[] roles
        )
            where TController : ControllerBase
        {
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId) };
            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var identity = new ClaimsIdentity(claims, authenticationType: "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal },
            };
            return controller;
        }

        /// <summary>
        /// Ustawia kontekst HTTP bez uwierzytelnionego użytkownika (żaden claim tożsamości).
        /// </summary>
        public static TController WithoutUser<TController>(this TController controller)
            where TController : ControllerBase
        {
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity()),
                },
            };
            return controller;
        }

        /// <summary>
        /// Zwraca wartość właściwości anonimowego obiektu (używane, gdy kontrolery zwracają
        /// <c>Ok(new { ... })</c>).
        /// </summary>
        public static object? GetProperty(this object value, string propertyName)
        {
            ArgumentNullException.ThrowIfNull(value);
            var property =
                value.GetType().GetProperty(propertyName)
                ?? throw new InvalidOperationException(
                    $"Property '{propertyName}' not found on {value.GetType().Name}."
                );
            return property.GetValue(value);
        }
    }
}
