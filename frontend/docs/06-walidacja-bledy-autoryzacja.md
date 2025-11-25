### 3.6. Walidacja, obsługa błędów i autoryzacja na froncie

#### Walidacja danych wejściowych (formularze)
- Formularze logowania/rejestracji korzystają z `react-hook-form` + `zodResolver`, co wymusza zgodność z kontraktami `signInSchema` i `signUpSchema`. Schemat sign-up narzuca złożoność hasła (małe/duże litery, cyfry) oraz spójność pól `password` / `confirmPassword` dzięki `superRefine`. Schemat logowania wymaga poprawnego emaila i niepustego hasła.【F:frontend/components/AuthComponents/AuthForm.tsx†L1-L93】【F:frontend/lib/schemas/authSchema.ts†L1-L32】
- Każde pole jest spięte z komponentami UI `FormField/FormMessage`, dzięki czemu błędy walidacji schematu pojawiają się inline. Domyślne wartości są rozdzielone dla logowania i rejestracji, co ogranicza ryzyko przesłania niepełnych danych przy zmianie wariantu formularza.【F:frontend/components/AuthComponents/AuthForm.tsx†L39-L78】【F:frontend/components/AuthComponents/AuthForm.tsx†L200-L252】
- Obsługa Google OAuth wykorzystuje klienta JS ładowanego w `useEffect`; brak SDK kończy się komunikatem `toast.error`, a poprawny token jest przekazywany do `googleVerify`, co centralizuje walidację i zapis tokenu.【F:frontend/components/AuthComponents/AuthForm.tsx†L94-L168】【F:frontend/lib/auth.ts†L46-L73】

#### Obsługa błędów (transport + UI)
- Globalny interceptor Axiosa w `lib/auth.ts` przechwytuje odpowiedzi 401 (poza samym logowaniem), usuwa token z `localStorage` i przekierowuje na `/sign-in`, synchronizując front z wygaśnięciem/odrzuceniem sesji backendu.【F:frontend/lib/auth.ts†L24-L38】
- Funkcja `onSubmit` w `AuthForm` różnicuje błędy uwierzytelnienia (400/401 oraz komunikaty zawierające `invalid`/`unauthorized`), błędy sieciowe (`network`/`failed to fetch`/`service unavailable`) i pozostałe wyjątki. Każdy przypadek ma dedykowany `toast.error` z opisem, a logika zamyka się w `try/catch/finally` z sygnałem ładowania w UI.【F:frontend/components/AuthComponents/AuthForm.tsx†L79-L193】
- Klient Axios (`lib/api.ts`) ustawia `baseURL` i opcjonalnie token Bearer; brak `NEXT_PUBLIC_API_URL` przerywa start aplikacji, co wcześnie sygnalizuje błędną konfigurację środowiska i zapobiega „cichym” błędom sieciowym.【F:frontend/lib/api.ts†L1-L20】
- W module AI rekomendacji (nie pokazany tu komponent) błędy są mapowane na typ `RecommendationApiError` z kodami domenowymi (np. `BILLING_INFO_MISSING`), co umożliwia prezentację dopasowanych komunikatów w UI i fallback do alternatywnych endpointów.【F:frontend/lib/api/RecommendationApiServiice.tsx†L1-L83】

#### Autoryzacja i ochrona tras
- Po udanym logowaniu (email/hasło lub Google) token Bearer jest zapisywany w `localStorage`, a interceptor requestów w `lib/api.ts` dołącza go do wszystkich zapytań w przeglądarce. Dzięki `withCredentials=true` obsługiwane są także ciasteczka sesyjne, jeśli backend je ustawia.【F:frontend/lib/api.ts†L8-L20】【F:frontend/components/AuthComponents/AuthForm.tsx†L120-L158】
- `middleware.ts` w warstwie edge sprawdza ciasteczko `token` dla ścieżek `/profile` i przekierowuje nieautoryzowanych użytkowników na `/sign-in`, ograniczając renderowanie chronionych widoków po stronie serwera i klienta.【F:frontend/app/middleware.ts†L1-L16】
- Funkcja `logoutUser` czyści token lokalny niezależnie od powodzenia wywołania API, a w przypadku 401 przechwyconego przez interceptor stan sesji zostaje wyzerowany, co domyka cykl autoryzacji w UI (brak „osieroconych” sesji).【F:frontend/lib/auth.ts†L24-L59】

#### Minimalny przepływ dla nowej funkcji chronionej (checklista)
1. **Dodaj walidację** – zdefiniuj schemat Zod i włącz go w `react-hook-form` lub weryfikuj payload przed wysłaniem do API.
2. **Obsłuż błąd transportu** – użyj globalnego klienta `api`; w `try/catch` mapuj statusy HTTP na komunikaty UI lub kody domenowe.
3. **Zabezpiecz trasę** – jeśli widok wymaga logowania, dodaj wzorzec z `middleware.ts` (matcher + przekierowanie) lub wykorzystaj istniejący guard `/profile` jako przykład.
4. **Zapisz/wyczyść token** – w logice sukcesu dodaj `localStorage.setItem('token', ...)`; w obsłudze błędu/wylogowania usuwaj token i ewentualnie przekierowuj na `/sign-in`.
