using VocareAPI.Core.Entities;
using VocareAPI.Core.Interfaces;
using OpenAI.GPT3.ObjectModels.RequestModels;
using OpenAI.GPT3.ObjectModels;
using OpenAI.GPT3.Managers;
using OpenAI.GPT3;


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
            string prompt = $"Na podstawie doświadczenia: {profile.Experience}, umiejętności: {profile.Skills}, " +
                            $"zainteresowań: {profile.Interests} oraz celów: {profile.Goals} " +
                            "Przygotuj najlepszy możliwy plan kariery dla użytkownika. Sugerując mu co najmniej 3 ścieżki kariery z przygotowanym planem działania " +
                            "oraz wskazując na możliwe szkolenia, kursy, certyfikaty, które mogą pomóc w realizacji celów zawodowych. " +
                            "Pamiętaj, że użytkownik jest ambitny i chce się rozwijać. " +
                            "Przenalizuj każdą ścieżkę kariery pod kątem możliwości rozwoju, zarobków, wymagań oraz perspektyw na przyszłość" + 
                            "Wypisz szczegółowo za i przeciw do każdej propozycji, uśrednij możliwe zarobki na każdym z podanych stanowisk" ;

            // Tworzymy obiekt zapytania do Completion
           var chatRequest = new ChatCompletionCreateRequest
            {
                Model = Models.ChatGpt3_5Turbo, 
                MaxTokens = 500,
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

            // Pobieramy wynik z pierwszego "choice"
            var recommendation = chatResponse.Choices?.FirstOrDefault()?.Message?.Content;

            return recommendation ?? "Brak rekomendacji";
        }
    }
}
