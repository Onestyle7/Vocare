using System;
using AutoMapper;

namespace VocareWebApi.Tests.Common
{
    /// <summary>
    /// Buduje realną instancję <see cref="IMapper"/> z wybranych profili AutoMappera –
    /// testy używają tej samej konfiguracji mapowań co aplikacja.
    /// </summary>
    public static class MapperFactory
    {
        private static MapperConfiguration BuildConfiguration(Type[] profileTypes)
        {
            var expression = new MapperConfigurationExpression();
            foreach (var profileType in profileTypes)
                expression.AddProfile(profileType);

            return new MapperConfiguration(expression);
        }

        public static IMapper Create(params Type[] profileTypes) =>
            BuildConfiguration(profileTypes).CreateMapper();

        public static void AssertValid(params Type[] profileTypes) =>
            BuildConfiguration(profileTypes).AssertConfigurationIsValid();
    }
}
