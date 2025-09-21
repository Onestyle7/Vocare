using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.Billing.Configuration
{
    public class SubscriptionPackagesConfiguration
    {
        private static Dictionary<string, SubscriptionPackage>? _packages;
        private static readonly object _lock = new object();

        public static void Initialize(IConfiguration configuration)
        {
            lock (_lock)
            {
                // Czytamy sekcję z konfiguracji
                var packagesSection = configuration.GetSection("SubscriptionPackages");
                var packagesList =
                    packagesSection.Get<List<SubscriptionPackage>>()
                    ?? new List<SubscriptionPackage>();

                // Tworzymy słownik z kluczem PriceId dla szybkiego dostępu
                _packages = packagesList.ToDictionary(p => p.PriceId, p => p);

                // Jeśli brak konfiguracji, używamy domyślnych wartości
                if (_packages.Count == 0)
                {
                    _packages = GetDefaultPackages();
                }
            }
        }

        /// <summary>
        /// Wszystkie domyślne pakiety subskrypcji
        /// </summary>
        public static Dictionary<string, SubscriptionPackage> Packages
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

        /// <summary>
        /// Pobiera domyślne pakiety subskrypcji po priceId
        /// </summary>
        /// <param name="priceId"></param>
        /// <returns></returns>
        public static SubscriptionPackage? GetPackageByPriceId(string priceId)
        {
            return Packages.TryGetValue(priceId, out var package) ? package : null;
        }

        /// <summary>
        /// Pobiera wszystkie aktywne pakiety subskrypcji
        /// </summary>
        /// <returns></returns>
        public static List<SubscriptionPackage> GetActivePackages()
        {
            return Packages.Values.Where(p => p.IsActive).ToList();
        }
        private static Dictionary<string, SubscriptionPackage> GetDefaultPackages()
        {
            return new Dictionary<string, SubscriptionPackage>
            {
                {
                    "price_1S9q33Ls2ndSVWb2KeB4Y3AD",
                    new SubscriptionPackage{
                        PriceId = "price_1S9q33Ls2ndSVWb2KeB4Y3AD",
                        Name = "Miesięczny",
                        Price = 39.99m,
                        Currency = "pln",
                        Interval = "month",
                        IntervalCount = 1,
                        Level = Models.Enums.SubscriptionLevel.Monthly,
                        IsActive = true
                    }
                }
            }
        }
    }
}
