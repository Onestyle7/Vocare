### Typy używane w zadaniach frontendu

Poniższe zestawienie zbiera wszystkie typy/DTO wykorzystywane w funkcjach wywołujących backend i komponentach realizujących zadania domenowe (autoryzacja, CV, profil, AI, analizy rynku, UI).

#### CV / Resume
- `CvLocationDto`, `CvBasicsDto`, `CvWorkEntryDto`, `CvEducationEntryDto`, `CvCertificateEntryDto`, `CvLanguageEntryDto`, `CvDto` – opisują struktury sekcji CV przekazywane do API generowania/edycji CV (`fetchGeneratedCv`, `createCv`, `updateCv`).【F:frontend/lib/types/resume.ts†L2-L49】【F:frontend/lib/types/cv.ts†L6-L49】
- `CvDetailsDto`, `CvListItemDto`, `CvLimits` – modele danych zwracane z endpointów listy/szczegółów CV wykorzystywane w widokach i limitach tworzenia.【F:frontend/lib/types/cv.ts†L51-L78】
- `CreateCvDto`, `UpdateCvDto` – payloady do tworzenia i aktualizacji CV używane przez `createCv`/`updateCv` w `lib/api/cv.ts`.【F:frontend/lib/types/cv.ts†L80-L94】

#### Profil użytkownika
- `CertificateEntry`, `EducationEntry`, `WorkExperienceEntry`, `LanguageEntry` – tablice w obrębie profilu użytkownika renderowane w formularzach profilu oraz wysyłane do `/api/UserProfile/*`.【F:frontend/lib/types/profile.ts†L3-L33】
- `PersonalityType` – enum (16 typów + `Unknown`) mapowany na wybór typu osobowości w ustawieniach profilu i wysyłany do backendu.【F:frontend/lib/types/profile.ts†L35-L53】
- `FinancialSurvey` – opcjonalna sekcja ankiety finansowej (pensje, kredyty, skłonność do ryzyka) wysyłana wraz z profilem.【F:frontend/lib/types/profile.ts†L55-L62】
- `UserProfile` – główny DTO profilu używany w `getUserProfile`, `createUserProfile`, `updateUserProfile`, `deleteUserProfile` oraz w komponentach formularzy profilu.【F:frontend/lib/types/profile.ts†L64-L81】

#### AI – rekomendacje kariery
- `AiCareerResponse` – kształt odpowiedzi AI (ścieżka główna + tablica ścieżek alternatywnych) używany przez `RecommendationsApiService` i komponenty prezentujące rekomendacje.【F:frontend/lib/types/recommendation.ts†L1-L17】
- `CareerPath` – opis pojedynczej ścieżki (nazwa, opis, prawdopodobieństwo, umiejętności, kursy, analiza SWOT) wyświetlany w kartach rekomendacji i raportach SWOT.【F:frontend/lib/types/recommendation.ts†L11-L23】

#### Analiza rynku
- `CareerStatisticsDto`, `IndustryStatisticsDto`, `MarketTrendsDto`, `SkillDemandDto` – struktury danych statystyk rynku (wynagrodzenia, zatrudnienie, trendy, popyt na umiejętności) renderowane w widokach analizy rynku.【F:frontend/lib/types/marketAnalysis.ts†L1-L34】
- `MarketAnalysisDetailsDto`, `MarketAnalysisResponseDto` – obiekty zwrotne z endpointów analizy rynku zawierające sekcje powyższych statystyk.【F:frontend/lib/types/marketAnalysis.ts†L30-L38】

#### Autoryzacja (Google OAuth)
- `GoogleAccounts`, `GoogleTokenClientConfig`, `GoogleTokenClient`, `GoogleTokenResponse`, `WindowWithGoogle` – typy używane w integracji OAuth (inicjalizacja klienta Google, obsługa tokenu, rozszerzenie `window`) w logice logowania Google.【F:frontend/lib/types/google-oauth.ts†L1-L27】

#### Animacje / komponenty UI
- `TimelineSize`, `TimelineStatus`, `TimelineColor`, `TimelineElement`, `TimelineProps` – typy komponentu osi czasu stosowane w sekcji „journey”/progressu użytkownika.【F:frontend/lib/types/timeline.ts†L3-L27】
- `MarqueeConfig` (z użyciem `gsap`) – konfiguracja animacji marquee wykorzystywana w sekcji marketingowej strony głównej.【F:frontend/lib/types/marquee.ts†L3-L27】

#### Task orchestration / API wywołujące zadania
- `fetchGeneratedCv` wykorzystuje typy CV (`CvDto`) i pobiera wygenerowane CV z `/api/Cv/generate` z nagłówkiem Bearer; używany w flow generowania CV z AI lub templatek.【F:frontend/lib/types/resume.ts†L55-L79】
- Funkcje API w `lib/api/cv.ts` (`createCv`, `getCvDetails`, `updateCv`, `deleteCv`, `getCvLimits`) operują na `CreateCvDto`/`UpdateCvDto` oraz `CvDetailsDto`/`CvLimits`, spinając UI edycji/listy CV z backendem.【F:frontend/lib/api/cv.ts†L1-L38】
- `getUserProfile`/`updateUserProfile` z `lib/profile.ts` pracują na `UserProfile`, przenosząc dane formularzy profilu do API i z powrotem.【F:frontend/lib/profile.ts†L1-L18】
- `RecommendationsApiService` używa `AiCareerResponse`/`CareerPath` i opakowuje błędy w `RecommendationApiError`, aby komponenty mogły reagować na kody domenowe (np. brak billing).【F:frontend/lib/api/RecommendationApiServiice.tsx†L1-L86】【F:frontend/lib/api/RecommendationApiServiice.tsx†L88-L139】

#### Mapowanie zadań na typy (skrót)
- CV/Resume: `CvDto`, `CreateCvDto`, `UpdateCvDto`, `CvDetailsDto`, `CvListItemDto`, `CvLimits` – tworzenie, edycja, generowanie, lista i limity CV.
- Profil: `UserProfile` + zagnieżdżone typy – CRUD profilu użytkownika.
- AI rekomendacje: `AiCareerResponse`, `CareerPath` – pobieranie/generowanie rekomendacji i raportów SWOT.
- Analiza rynku: `CareerStatisticsDto`...`MarketAnalysisResponseDto` – wizualizacja trendów i statystyk rynku.
- Autoryzacja: typy Google OAuth – logowanie społecznościowe.
- UI: typy `Timeline*`, `MarqueeConfig` – komponenty prezentacyjne wykorzystywane w zadaniach marketingowych/UX.
