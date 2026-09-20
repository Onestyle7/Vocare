using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using VocareWebAPI.Data;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Wariant <see cref="AppDbContext"/> na potrzeby testów jednostkowych opartych o dostawcę
    /// InMemory. Rejestruje konwersję dla typu <see cref="Vector"/> z Pgvector, dzięki czemu
    /// właściwości wektorowe (osadzenia) są traktowane jak skalary i model daje się zbudować
    /// bez sterownika PostgreSQL.
    /// </summary>
    public sealed class TestAppDbContext : AppDbContext
    {
        public TestAppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);

            configurationBuilder.Properties<Vector>().HaveConversion<VectorToStringConverter>();
        }

        private sealed class VectorToStringConverter
            : Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<Vector, string>
        {
            public VectorToStringConverter()
                : base(v => string.Join(",", v.ToArray()), s => Parse(s)) { }

            private static Vector Parse(string value)
            {
                if (string.IsNullOrWhiteSpace(value))
                    return new Vector(Array.Empty<float>());

                var floats = value
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => float.Parse(x, System.Globalization.CultureInfo.InvariantCulture))
                    .ToArray();
                return new Vector(floats);
            }
        }
    }
}
