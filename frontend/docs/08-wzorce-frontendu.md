# 3.x Wzorce i konwencje architektoniczne we froncie

## Kontekst + custom hook jako warstwa stanu współdzielonego
- `TokenBalanceProvider` opakowuje cały layout (`app/layout.tsx`), udostępniając stan salda/subskrypcji z hooka `useTokenBalance` do wszystkich komponentów potomnych. Zapewnia to kompozycję providerów i kontrolę błędnego użycia poprzez `useTokenBalanceContext` (wyjątek poza providerem).

## Serwis + hook do komunikacji z API
- `RecommendationsApiService` kapsułkuje żądania do AI (pobranie/generowanie rekomendacji), mapuje kody HTTP na błędy domenowe i dostarcza metodę `getRecommendationsWithFallback` (strategia fallback: ostatnia rekomendacja → generowanie nowej). Funkcje serwisu są eksponowane do komponentów przez hook `useRecommendationsApi`.
- Globalny klient `api` (Axios) to pojedynczy punkt konfiguracji poświadczeń/`baseURL` oraz interceptor dołączający Bearer Token, co ujednolica komunikację z backendem i minimalizuje duplikację kodu w modułach API.

## Middleware jako strażnik tras
- `app/middleware.ts` pełni rolę guardiana tras profilu; weryfikuje obecność ciasteczka `token` i przekierowuje na `/sign-in` bez renderowania stron chronionych.

## Walidacja formularzy w oparciu o schematy
- `AuthForm` wykorzystuje wzorzec formularza sterowanego (`react-hook-form`) z resolverem Zod; jeden komponent obsługuje logikę logowania i rejestracji, a obsługa błędów (Axios/HTTP) jest enkapsulowana w funkcji `onSubmit`. Dzięki temu walidacja i zachowanie toasts są spójne między wariantami formularza, co redukuje duplikację.
