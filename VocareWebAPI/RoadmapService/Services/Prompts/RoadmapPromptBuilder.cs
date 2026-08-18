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
                4. Każdy kolejny krok wskazuje przez parentRef na tempId swojego rodzica. Wielu kroków MOŻE wskazywać na tego samego rodzica — to tworzy rozgałęzienie (np. alternatywne ścieżki nauki).
                5. Kroki oznaczone jako ""optional"" to ciekawe zagadnienia poszerzające kompetencje, ale niekonieczne do osiągnięcia celu.
                6. Kroki ""required"" to fundament — bez nich cel nie zostanie osiągnięty.
                7. Każdy krok musi mieć unikalne tempId w formacie ""phase{N}_step{M}"" (np. ""phase1_step1"").
                8. Oceń realistycznie czy cel jest osiągalny w podanym horyzoncie czasowym. Jeśli nie — ustaw isAchievable na false i wyjaśnij w feasibilityNote.
                9. Topics to konkretne zagadnienia do zrealizowania w ramach kroku — minimum 2, maksimum 5 na krok.
                10. Opisy kroków powinny być konkretne i praktyczne — nie ogólnikowe.
                11. Każda faza MUSI mieć startMonth i endMonth (int) — numer miesiąca w ramach horyzontu czasowego (zaczynając od 1). Fazy muszą pokrywać cały horyzont bez luk i bez nakładania się. Przykład dla 12 miesięcy: faza 1 (1-3), faza 2 (4-8), faza 3 (9-12).
                12. Tytuł fazy NIE MOŻE zawierać zakresu czasowego (np. ""M1–M4"", ""miesiąc 1-3"") — informacja o czasie jest przekazywana wyłącznie przez pola startMonth i endMonth.
                13. Tytuł kroku (title) MUSI być krótki (1-3 słowa), technologiczny i konkretny, np. ""JavaScript"", ""Google Ads"", ""Audyt konta"". Dodatkowy kontekst trafia do subtitle (1 krótkie zdanie). Szczegóły co user ma zrobić trafiają do description.
                14. Twórz rozgałęzienia gdy istnieją równoważne alternatywy technologiczne (np. React vs Vue vs Angular) lub równoległe ścieżki specjalizacji. Maksymalnie 5 rozgałęzień z jednego kroku. NIE twórz rozgałęzień na siłę — liniowa ścieżka jest poprawna gdy kolejność jest jednoznaczna.
                
                WYMAGANY FORMAT JSON:
                {
                ""title"": ""string — tytuł roadmapy bez zakresu czasowego"",
                ""isAchievable"": true/false,
                ""feasibilityNote"": ""string lub null — wyjaśnienie jeśli cel nieosiągalny w zadanym czasie"",
                ""phases"": [
                    {
                    ""title"": ""string — nazwa fazy"",
                    ""orderIndex"": 0,
                    ""startMonth"": 1,
                    ""endMonth"": 3,
                    ""steps"": [
                        {
                        ""tempId"": ""phase1_step1"",
                        ""parentRef"": null,
                        ""title"": ""Podstawy języka"",
                        ""subtitle"": ""Składnia, typy danych, kontrola przepływu"",
                        ""description"": ""Poznaj zmienne, funkcje, tablice, obiekty oraz obsługę błędów."",
                        ""topics"": [""zmienne i typy"", ""funkcje"", ""tablice i obiekty""],
                        ""stepType"": ""required"",
                        ""orderIndex"": 0
                        },
                        {
                        ""tempId"": ""phase1_step2"",
                        ""parentRef"": ""phase1_step1"",
                        ""title"": ""React"",
                        ""subtitle"": ""Komponenty, hooki i stan aplikacji"",
                        ""description"": ""Naucz się budować interfejsy w React — komponenty, props, useState, useEffect."",
                        ""topics"": [""JSX"", ""komponenty"", ""hooki""],
                        ""stepType"": ""required"",
                        ""orderIndex"": 1
                        },
                        {
                        ""tempId"": ""phase1_step3"",
                        ""parentRef"": ""phase1_step1"",
                        ""title"": ""Vue"",
                        ""subtitle"": ""Alternatywa — reaktywność i Composition API"",
                        ""description"": ""Poznaj Vue jako alternatywną ścieżkę frontendową — reaktywność, dyrektywy, Composition API."",
                        ""topics"": [""reaktywność"", ""dyrektywy"", ""Composition API""],
                        ""stepType"": ""optional"",
                        ""orderIndex"": 2
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
            - Horyzont czasowy do rozłożenia na fazy: {request.TimeHorizonMonths} miesięcy (startMonth zaczyna się od 1, ostatnia faza musi mieć endMonth = {request.TimeHorizonMonths})

            INSTRUKCJE:
            1. Skup się na LUCE KOMPETENCYJNEJ — różnicy między tym co user umie a tym czego wymaga ścieżka.
            2. Nie powtarzaj umiejętności które user już posiada jako osobne kroki — możesz je uwzględnić jako punkty wyjścia.
            3. Zacznij od fundamentów i buduj progresywnie w kierunku celu.
            4. Kroki opcjonalne (stepType: ""optional"") to zagadnienia poszerzające wiedzę ale niekonieczne.
            5. Oceń czy {request.CareerPathName} na poziomie {request.SuggestedSeniority} jest realistycznie osiągalny w {request.TimeHorizonMonths} miesięcy.
            6. Jeśli nie jest osiągalny — ustaw isAchievable: false i w feasibilityNote wyjaśnij co user może realnie osiągnąć w tym czasie.
            7. Tytuły kroków muszą być krótkie (1-3 słowa). Kontekst umieść w subtitle. Przykłady:
            - title: ""Smart Bidding"" / subtitle: ""Strategie stawek i cele konwersji""
            - title: ""Audyt konta"" / subtitle: ""Checklisty, priorytety i plan naprawczy""
            - title: ""Remarketing"" / subtitle: ""Segmentacja odbiorców w Google Ads""
            8. Jeśli w ramach ścieżki istnieją równoważne technologie do wyboru (np. frameworki, narzędzia, specjalizacje) — twórz rozgałęzienia. Krok-rodzic to punkt decyzyjny, a jego dzieci to alternatywy. Liniowa ścieżka jest domyślna gdy kolejność jest jednoznaczna.

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
