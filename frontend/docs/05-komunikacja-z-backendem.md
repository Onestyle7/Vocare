### 3.5. Komunikacja z backendem (.NET)

#### Warstwa transportowa – klient HTTP
- Podstawowym klientem jest instancja Axios zdefiniowana w `lib/api.ts`, która korzysta z `NEXT_PUBLIC_API_URL` jako `baseURL`, ustawia `withCredentials=true` oraz w środowisku przeglądarki wstrzykuje nagłówek `Authorization: Bearer <token>` z `localStorage`. Brak zmiennej środowiskowej przerywa start builda, co chroni przed błędną konfiguracją URL środowiska.【F:frontend/lib/api.ts†L1-L20】
- Odpowiedzi przechodzą przez globalny interceptor (`lib/auth.ts`), który przy statusie 401 usuwa token i przekierowuje użytkownika na `/sign-in` (poza ścieżką logowania), zapewniając spójne wygaszenie sesji na froncie.【F:frontend/lib/auth.ts†L24-L38】

#### Typy DTO wykorzystywane w żądaniach/odpowiedziach
- CV: kontrakty `CvDetailsDto`, `CvListItemDto`, `CreateCvDto` i `UpdateCvDto` obejmują m.in. strukturę sekcji CV, pola bazowe oraz metadane (`isDefault`, `version`, znaczniki czasu).【F:frontend/lib/types/cv.ts†L1-L74】
- Profil użytkownika: `UserProfile` oraz zagnieżdżone typy (wykształcenie, doświadczenie, certyfikaty, ankieta finansowa) opisują pełny model profilu wysyłany do API profilu użytkownika.【F:frontend/lib/types/profile.ts†L1-L64】
- AI rekomendacje: `AiCareerResponse` i `CareerPath` definiują strukturę rekomendacji kariery, wyników SWOT, kursów oraz ścieżek z prawdopodobieństwem.【F:frontend/lib/types/recommendation.ts†L1-L19】

#### Przykładowe wywołania API
- CV / Resume: moduł `lib/api/cv.ts` udostępnia funkcje wysokiego poziomu mapujące na endpointy REST (`POST /api/cvs/create`, `GET /api/cvs/details/{id}`, `PUT /api/cvs/update/{id}`, `DELETE /api/cvs/delete/{id}`) i przyjmujące DTO jako argumenty. Zapytania przyjmują opcjonalny `AbortSignal`, co ułatwia anulowanie żądania w komponentach.【F:frontend/lib/api/cv.ts†L1-L38】
- Profil użytkownika: `lib/profile.ts` zapewnia `getUserProfile`, `createUserProfile`, `updateUserProfile` i `deleteUserProfile`, operując na typie `UserProfile` oraz wspólnym prefiksie `/api/UserProfile/*`. Wszystkie operacje wykorzystują klienta Axios z domyślnymi nagłówkami/tokenem.【F:frontend/lib/profile.ts†L1-L18】
- Autoryzacja: `lib/auth.ts` realizuje rejestrację, logowanie, weryfikację Google oraz reset hasła poprzez prefiks `http://localhost:8080/api/Auth`, zapisuje token w `localStorage` po udanym logowaniu i umożliwia wylogowanie z czyszczeniem stanu przeglądarki.【F:frontend/lib/auth.ts†L1-L73】
- AI – rekomendacje kariery: `RecommendationsApiService` używa dedykowanych nagłówków Bearer i oferuje metody `getLastRecommendation`, `generateNewRecommendation` oraz strategię `getRecommendationsWithFallback`, która przy błędach 404/500 pobiera dane z alternatywnego endpointu.【F:frontend/lib/api/RecommendationApiServiice.tsx†L1-L86】【F:frontend/lib/api/RecommendationApiServiice.tsx†L88-L139】

#### Obsługa błędów i odporność
- Warstwa auth przechwytuje 401 (poza logowaniem) i wymusza ponowne logowanie, co synchronizuje stan sesji między backendem a frontendem.【F:frontend/lib/auth.ts†L24-L38】
- Serwis rekomendacji mapuje `AxiosError` na domenowe kody błędów (np. `BILLING_INFO_MISSING` przy 500 i komunikacie o billing) i rzuca typ `RecommendationApiError`, który komponent może interpretować w UI (np. wyświetlić komunikat o brakujących danych billingowych).【F:frontend/lib/api/RecommendationApiServiice.tsx†L36-L86】
- W pozostałych modułach błędy sieciowe propagują się z Axiosa do komponentów; dzięki opcjonalnym `AbortSignal` można bezpiecznie anulować żądania przy zmianie widoku i uniknąć aktualizacji stanu po unmountcie.

#### Przykładowa mapa endpointów (frontend → backend)
- Autoryzacja: `POST /api/Auth/register`, `POST /api/Auth/login`, `POST /api/Auth/google-verify`, `POST /api/Auth/forgot-password`, `GET /api/Auth/validate-reset-token`, `POST /api/Auth/reset-password`, `POST /api/Auth/logout`【F:frontend/lib/auth.ts†L1-L73】
- Profil użytkownika: `GET /api/UserProfile/GetCurrentUserProfile`, `POST /api/UserProfile/CreateCurrentUserProfile`, `PUT /api/UserProfile/UpdateCurrentUserProfile`, `DELETE /api/UserProfile/DeleteCurrentUserProfile`【F:frontend/lib/profile.ts†L1-L18】
- CV / Resume: `POST /api/cvs/create`, `GET /api/cvs/details/{id}`, `GET /api/cvs/my-cvs`, `GET /api/cvs/limits`, `PUT /api/cvs/update/{id}`, `DELETE /api/cvs/delete/{id}`【F:frontend/lib/api/cv.ts†L1-L38】
- AI – Rekomendacje kariery: `GET /api/Ai/last-recommendation`, `GET /api/Ai/recommendations` (fallback przy braku danych)【F:frontend/lib/api/RecommendationApiServiice.tsx†L1-L86】

#### Wzorzec użycia w komponencie (pseudokod)
1. Zaimportuj funkcję/serwis (np. `getUserProfile` lub hook `useRecommendationsApi`).
2. Wywołaj ją w handlerze / `useEffect` z obsługą `try/catch`; w przypadku błędu `RecommendationApiError` rozpoznaj `code` i pokaż dopasowany komunikat.
3. W przypadku formularzy (np. auth) obsłuż redirect na podstawie statusu 401, który zostanie wymuszony przez interceptor; komponent powinien jedynie prezentować komunikat błędu.
