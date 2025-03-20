using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    public class PerplexityAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;

        public PerplexityAiService(IOptions<AiConfig> config, HttpClient httpClient)
        {
            _config = config.Value;
            _httpClient = httpClient;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<string> GetCareerRecommendationsAsync(UserProfile profile)
        {
            var prompt = BuildPrompt(profile);

            var requestBody = new
            {
                model = _config.Model,
                messages = new[] { new { role = "user", content = prompt } },
            };
            try
            {
                var absoluteUri = new Uri(_config.BaseUrl + "/chat/completions");
                var response = await _httpClient.PostAsJsonAsync(absoluteUri, requestBody);

                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsStringAsync();
            }
            catch (HttpRequestException e)
            {
                throw new AiServiceException("Błąd komunikacji z API", e);
            }
        }

        private string BuildPrompt(UserProfile profile)
        {
            return $"""
                Jesteś doradcą zawodowym. Na podstawie poniższych danych użytkownika:
                - Imię: {profile.FirstName} {profile.LastName}
                - Umiejętności: {string.Join(", ", profile.Skills)}
                - Doświadczenie: {profile.WorkExperience} lat {string.Join(
                    ", ",
                    profile.Certificates
                )}
                - Lokalizacja: {profile.Country}, {profile.Address}
                - Wykształcenie: {profile.Education}
                - Języki: {string.Join(", ", profile.Languages)}
                - Dodatkowe informacje: {profile.AdditionalInformation}
                - O mnie: {profile.AboutMe}

                Wygeneruj 3 propozycje ścieżek kariery w formacie JSON z polami:
                - careerName (nazwa ścieżki)
                - description (krótki opis)
                - probability (szansa powodzenia w %)
                - requiredSkills (brakujące umiejętności)
                Do każdej z wygenerowanych ścieżek przeprowadź analizę rynku konkurencji i zwróć 3 najważniejsze wnioski.
                Do tego Wygeneruj 3 propozycje kursów, które użytkownik powinien ukończyć, aby osiągnąć sukces w danej ścieżce kariery.
                Podsumuj to analizą SWOT, w której przedstawisz mocne i słabe strony, szanse i zagrożenia dla każdej z propozycji.
                Na koniec zwróć użytkownikowi pełną rekomendację zawodową w formacie JSON.
                """;
        }
    }

    public class AiServiceException : Exception
    {
        public AiServiceException(string message, Exception inner)
            : base(message, inner) { }
    }
}
