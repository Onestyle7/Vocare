using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Dtos;

namespace VocareWebAPI.RoadmapService.Services.Prompts
{
    /// <summary>
    /// Buduje prompt systemowy i uzytkownika do generowania roadmapy przez OPEN AI
    /// </summary>
    public static class RoadmapPromptBuilder
    {
        public static string BuildSystemPrompt()
        {
            return @"Jesteś ekspertem od planowania kariery zawodowej. Twoim zadaniem jest wygenerowanie szczegółowej roadmapy rozwoju zawodowego.

            ZASADY:
            1. Odpowiadaj WYŁĄCZNIE poprawnym JSONem — bez komentarzy, bez markdown, bez tekstu przed/po JSON.
            2. Roadmapa musi mieć strukturę drzewiastą — każdy krok ma co najwyżej jednego rodzica (parentRef).
            3. Pierwszy krok w każdej fazie MUSI mieć parentRef: null (jest rootem fazy).
            4. Kolejne kroki wskazują na poprzedni krok przez parentRef (wartość tempId rodzica).
            5. Kroki oznaczone jako ""optional"" to ciekawe zagadnienia poszerzające kompetencje, ale niekonieczne do osiągnięcia celu.
            6. Kroki ""required"" to fundament — bez nich cel nie zostanie osiągnięty.
            7. Każdy krok musi mieć unikalne tempId w formacie ""phase{N}_step{M}"" (np. ""phase1_step1"").
            8. Oceń realistycznie czy cel jest osiągalny w podanym horyzoncie czasowym. Jeśli nie — ustaw isAchievable na false i wyjaśnij w feasibilityNote.
            9. Topics to konkretne zagadnienia do zrealizowania w ramach kroku — minimum 2, maksimum 5 na krok.
            10. Opisy kroków powinny być konkretne i praktyczne — nie ogólnikowe.

            WYMAGANY FORMAT JSON:
            {
            ""title"": ""string — tytuł roadmapy"",
            ""isAchievable"": true/false,
            ""feasibilityNote"": ""string lub null — wyjaśnienie jeśli cel nieosiągalny w zadanym czasie"",
            ""phases"": [
                {
                ""title"": ""string — nazwa fazy"",
                ""orderIndex"": 0,
                ""steps"": [
                    {
                    ""tempId"": ""phase1_step1"",
                    ""parentRef"": null,
                    ""title"": ""string — nazwa kroku"",
                    ""description"": ""string — opis co user ma zrobić"",
                    ""topics"": [""temat1"", ""temat2""],
                    ""stepType"": ""required"",
                    ""orderIndex"": 0
                    },
                    {
                    ""tempId"": ""phase1_step2"",
                    ""parentRef"": ""phase1_step1"",
                    ""title"": ""string"",
                    ""description"": ""string"",
                    ""topics"": [""temat1"", ""temat2""],
                    ""stepType"": ""required"",
                    ""orderIndex"": 1
                    }
                ]
                }
            ]
            }";
        }

        public static string BuildUserPrompt(RoadmapGenerationRequest request)
        {
            var (maxPhases, maxStepsPerPhase, granularity) = GetHorizonRules(
                request.TimeHorizonMonths
            );

            var userSkills = request.UserSkills.Any()
                ? string.Join(", ", request.UserSkills)
                : "Brak zadeklarowanych umiejętności";

            var requiredSkills = request.RequiredSkills.Any()
                ? string.Join(", ", request.RequiredSkills)
                : "Brak określonych wymagań";

            return $@"Wygeneruj roadmapę rozwoju zawodowego na podstawie poniższych danych:

            CEL ZAWODOWY: {request.CareerPathName}
            DOCELOWY POZIOM: {request.SuggestedSeniority}
            HORYZONT CZASOWY: {request.TimeHorizonMonths} miesięcy

            OBECNE UMIEJĘTNOŚCI UŻYTKOWNIKA:
            {userSkills}

            WYMAGANE UMIEJĘTNOŚCI DLA TEJ ŚCIEŻKI:
            {requiredSkills}

            REGUŁY DLA TEGO HORYZONTU:
            - Maksymalna liczba faz: {maxPhases}
            - Maksymalna liczba kroków na fazę: {maxStepsPerPhase}
            - Granularność planowania: {granularity}

            INSTRUKCJE:
            1. Skup się na LUCE KOMPETENCYJNEJ — różnicy między tym co user umie a tym czego wymaga ścieżka.
            2. Nie powtarzaj umiejętności które user już posiada jako osobne kroki — możesz je uwzględnić jako punkty wyjścia.
            3. Zacznij od fundamentów i buduj progresywnie w kierunku celu.
            4. Kroki opcjonalne (stepType: ""optional"") to zagadnienia poszerzające wiedzę ale niekonieczne.
            5. Oceń czy {request.CareerPathName} na poziomie {request.SuggestedSeniority} jest realistycznie osiągalny w {request.TimeHorizonMonths} miesięcy.
            6. Jeśli nie jest osiągalny — ustaw isAchievable: false i w feasibilityNote wyjaśnij co user może realnie osiągnąć w tym czasie.

            Odpowiedz WYŁĄCZNIE poprawnym JSONem zgodnym ze schematem.";
        }

        private static (int maxPhases, int maxStepsPerPhase, string granularity) GetHorizonRules(
            int months
        )
        {
            return months switch
            {
                <= 3 => (2, 8, "tygodniowa"),
                <= 6 => (3, 10, "dwutygodniowa"),
                <= 12 => (4, 12, "miesięczna"),
                <= 24 => (6, 15, "kwartalna"),
                _ => (6, 15, "kwartalna"), // fallback dla > 24 miesięcy
            };
        }
    }
}
