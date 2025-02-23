using VocareAPI.Core.Entities;
using VocareAPI.Core.Interfaces;
using OpenAI.GPT3.ObjectModels.RequestModels;
using OpenAI.GPT3.ObjectModels;
using OpenAI.GPT3.Managers;
using OpenAI.GPT3;
using VocareAPI.Core.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;


namespace VocareAPI.Infrastructure
{
    public class OpenAICareerService : IAIService
    {
        private readonly OpenAIService _openAiService;

        public OpenAICareerService(IConfiguration configuration)
        {
            var apiKey = configuration["OpenAI:ApiKey"]
                ?? throw new InvalidOperationException("OpenAI API key is missing");

            var options = new OpenAiOptions
            {
                ApiKey = apiKey
                
            };

            _openAiService = new OpenAIService(options);
        }

        public async Task<string> GetCareerRecommendationAsync(UserProfile profile)
        {
            

            // Przygotowujemy prompt
           string prompt = 
            $"Użytkownik chce zdobyć lepszą pracę na podstawie swoich predyspozycji i umiejętności. " +
            $"Na podstawie jego doświadczenia: {SerializeExperience(profile.Experience)}, " +
            $"umiejętności: {SerializeSkills(profile.Skills)}, " +
            $"zainteresowań: {string.Join(", ", profile.Interests)}, " +
            $"preferencji środowiska pracy: {profile.WorkEnvironmentPreference}, " +
            $"oczekiwanego wynagrodzenia: {profile.ExpectedSalary} PLN, " +
            $"i dostępności czasowej na naukę: {profile.WeeklyLearningAvailability} godzin tygodniowo, " +
            "zaproponuj trzy możliwe ścieżki kariery, które mogą pasować do jego profilu. " +
            "Dla każdej ścieżki podaj opis, wymagane umiejętności, sugerowane kroki do podjęcia " +
            "(np. kursy, certyfikaty), potencjalne zarobki i perspektywy rozwoju.";

            // Tworzymy obiekt zapytania do Completion
           var chatRequest = new ChatCompletionCreateRequest
            {
                Model = Models.Gpt_4, 
                MaxTokens = 1500,
                Temperature = 0.7f,
                Messages = new List<ChatMessage>
                {
                    ChatMessage.FromUser(prompt)
                }
            };

            // Wywołujemy CreateCompletion
            var chatResponse = await _openAiService.ChatCompletion.CreateCompletion(chatRequest);
            Console.WriteLine("=== OpenAI Completion Result ===");
            Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(chatResponse));
            if(chatResponse.Error is not null){
                System.Console.WriteLine($"OpenAI Error: {chatResponse.Error.Message}");
                return $"Błąd OpenAI: {chatResponse.Error.Message}";
            }
            // Pobieramy wynik z pierwszego "choice"
            var recommendation = chatResponse.Choices?.FirstOrDefault()?.Message?.Content;

            return recommendation ?? "Brak rekomendacji";
        }
        private string SerializeExperience(List<ExperienceEntry> experience)
         => string.Join(", ", experience.Select(e => $"{e.Position} ({e.Industry})"));

        private string SerializeSkills(List<SkillEntry> skills)
            => string.Join(", ", skills.Select(s => $"{s.Name}"));
    }
}
