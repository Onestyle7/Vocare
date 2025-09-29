using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.Billing.Configuration
{
    public class TokenPackagesConfiguration
    {
        private static Dictionary<string, TokenPackage>? _packages;
        private static readonly object _lock = new object();

        public static void Initialize(IConfiguration configuration)
        {
            lock (_lock)
            {
                var packagesSection = configuration.GetSection("TokenPackages");
                var packagesList =
                    packagesSection.Get<List<TokenPackage>>() ?? new List<TokenPackage>();

                _packages = packagesList.ToDictionary(p => p.PriceId, p => p);

                // Jeśli brak konfiguracji w appsettings, użyj domyślnych wartości
                if (_packages.Count == 0)
                {
                    _packages = GetDefaultPackages();
                }
            }
        }

        public static Dictionary<string, TokenPackage> Packages
        {
            get
            {
                if (_packages == null)
                {
                    lock (_lock)
                    {
                        _packages ??= GetDefaultPackages();
                    }
                }
                return _packages;
            }
        }

        public static TokenPackage? GetPackageByPriceId(string priceId)
        {
            return Packages.TryGetValue(priceId, out var package) ? package : null;
        }

        private static Dictionary<string, TokenPackage> GetDefaultPackages()
        {
            return new Dictionary<string, TokenPackage>
            {
                {
                    "price_1RDpyOLs2ndSVWb2TVahQNgY",
                    new TokenPackage
                    {
                        PriceId = "price_1RDpyOLs2ndSVWb2TVahQNgY",
                        Name = "Standard Token Pack",
                        TokenAmount = 50,
                        Price = 50.00m,
                        Currency = "pln",
                    }
                },
            };
        }
    }
}
