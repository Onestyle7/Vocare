# Plan testów end-to-end (Cypress)

## Cele
- Zweryfikować kluczowe ścieżki użytkownika (logowanie, rekomendacje, marketplace, zakup tokenów) przy każdym wdrożeniu na środowisko deweloperskie.
- Zapewnić szybki feedback lokalny dla deweloperów oraz niezawodny zestaw regresyjny w CI/CD.
- Utrzymywać testy w sposób modułowy, łatwy do rozbudowy o kolejne strony i przypadki użycia.

## Architektura testów
- **Struktura katalogów**:
  - `cypress/e2e/<obszar>/<test>.cy.ts` – scenariusze end-to-end zorganizowane wg obszarów aplikacji.
  - `cypress/fixtures` – dane testowe i mocki odpowiedzi API.
  - `cypress/support` – wspólne hooki, komendy oraz konfiguracja globalna.
- **Selektory**: aplikacja udostępnia atrybuty `data-cy` na elementach interakcyjnych. Dzięki temu testy są odporne na zmiany layoutu lub klas CSS.
- **Dane konfiguracyjne**: w pliku `cypress.env.json` (bazując na `cypress.env.example`) przechowujemy adresy usług oraz poświadczenia testowe, aby nie trafiały do repozytorium.

## Strategie testowania stron
- **Logowanie i autoryzacja** (priorytet):
  - Scenariusze pozytywne (poprawne dane), błędne hasło, brak konta, obsługa wylogowania.
  - Mockowanie odpowiedzi API przy testach komponentowych oraz integracyjnych; pełne e2e z prawdziwym backendem w pipeline'ie.
- **Dashboard / rekomendacje**:
  - Walidacja renderowania kluczowych sekcji i kart rekomendacji.
  - Testy danych dynamicznych z kontrolą stanu (stubowanie API) oraz smoke test z realnym backendem.
- **Marketplace**:
  - Nawigacja po listach, filtrowanie, szczegóły oferty.
  - Testowanie scenariuszy krytycznych: dodanie do koszyka, weryfikacja dostępności.
- **Kupowanie tokenów**:
  - Sprawdzenie kalkulatora/wyceny, walidacji formularza, potwierdzenia zakupu.
  - Oddzielenie ścieżki płatności w trybie mockowanym od testów integracyjnych na sandboxie dostawcy płatności.

## Integracja z pipeline CI/CD
- Dedykowany job `e2e-dev` uruchamiany przy każdym deployu na środowisko deweloperskie.
  - Kroki: instalacja zależności, uruchomienie backendu i frontendu (Docker/docker-compose), start testów `npm run test:e2e`.
  - Artefakty: raport JUnit/HTML, zrzuty ekranu i wideo w przypadku błędów.
- Smoke test uruchamiany na świeżym deployu produkcyjnym (tylko kluczowe ścieżki biznesowe).

## Dobre praktyki utrzymaniowe
- Dodawanie testów dla nowych widoków w tym samym PR, który wprowadza funkcjonalność.
- Regularna refaktoryzacja wspólnych akcji (logowanie, przygotowanie danych) do komend w `cypress/support/commands.ts`.
- Monitorowanie czasu wykonania – dzielenie scenariuszy na mniejsze pakiety uruchamiane równolegle w CI.
- Wersjonowanie mocków API oraz korzystanie z kontraktów, aby unikać zaskoczeń przy zmianach backendu.
- Dokumentowanie nietypowych zależności testowych w README testów oraz utrzymywanie listy użytkowników testowych.

## Następne kroki
1. Sparametryzować test logowania do pracy zarówno na mockowanym API (lokalnie) jak i na realnym środowisku testowym.
2. Dodać komendy pomocnicze (`cy.login`, `cy.resetState`) w `cypress/support/commands.ts`.
3. Rozbudować zestaw testów o ścieżki rekomendacji, marketplace i zakupu tokenów zgodnie z powyższymi strategiami.
4. Zintegrować uruchamianie `npm run test:e2e` z pipeline'm deployu na środowisko `dev`.
