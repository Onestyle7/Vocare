# Analiza jakości CV — brief UI/UX

## Cel dokumentu

Ten dokument opisuje ekran analizy jakości CV w aplikacji Vocare. Jest przeznaczony dla kreatora UI/UX oraz osoby implementującej frontend. Projekt powinien korzystać wyłącznie z danych faktycznie dostępnych w backendzie, a elementy wymagające zmian API są oznaczone osobno.

## Kontekst produktu

Vocare jest aplikacją wspierającą rozwój kariery. Moduł CV pozwala użytkownikowi tworzyć, edytować, zapisywać i eksportować wiele wersji CV. Analiza AI ma pomóc użytkownikowi zrozumieć jakość treści dokumentu oraz wskazać poprawki o największym wpływie.

Analiza dotyczy treści i kompletności danych zapisanych w CV. Nie jest technicznym testem finalnego pliku PDF i nie gwarantuje przejścia przez konkretny system ATS. W interfejsie należy używać określenia „Analiza jakości CV” lub „Ocena CV”, a nie „gwarantowany wynik ATS”.

## Miejsce w produkcie

Podstawowym miejscem funkcji jest ekran edycji pojedynczego CV. Analiza powinna być dostępna jako:

- przycisk „Analizuj CV” w górnym pasku edytora;
- boczny panel na desktopie, otwierany bez opuszczania edytora;
- pełnoekranowy panel lub bottom sheet na urządzeniu mobilnym;
- opcjonalnie mały skrót z ostatnim wynikiem na karcie CV w dashboardzie — dopiero po rozszerzeniu danych listy CV.

Użytkownik powinien móc przejść z rekomendacji bezpośrednio do właściwej sekcji formularza.

## Aktualny kontrakt backendu

### Uruchomienie analizy

`POST /api/cvs/analyze/{cvId}`

- wymaga zalogowanego użytkownika;
- sprawdza, czy CV należy do użytkownika;
- jest usługą rozliczaną jako `AnalyzeCv` i może zużywać tokeny/limit planu;
- tworzy pierwszą analizę albo nadpisuje poprzednią;
- może trwać długo, ponieważ korzysta z zewnętrznego modelu AI.

### Pobranie ostatniej analizy

`GET /api/cvs/analysis/{cvId}`

- zwraca ostatnią zapisaną analizę;
- jeśli analiza nie istnieje, backend zwraca błąd `CvAnalysisNotFoundException`;
- pobranie istniejącego wyniku nie powinno być przedstawiane jako ponowne płatne analizowanie.

### Odpowiedź API

```ts
interface CvAnalysisResult {
  overallScore: number; // 0–100
  targetPositionScore: number; // 0–100; backend zwraca 0, gdy nie ustawiono stanowiska
  sectionScores: Array<{
    sectionName: string;
    score: number; // 0–100
    insights: string[];
  }>;
  topImprovements: string[];
}
```

Backend oczekuje wyników dla następujących sekcji:

| `sectionName` | Polska etykieta | Docelowa sekcja edytora |
| --- | --- | --- |
| `Basics` | Dane podstawowe | `profile` |
| `Work` | Doświadczenie | `experience` |
| `Education` | Wykształcenie | `education` |
| `Certificates` | Certyfikaty | `certificates` |
| `Skills` | Umiejętności | `skills` |
| `Languages` | Języki | `languages` |
| `Projects` | Projekty | `projects` |
| `Social` | Linki i portfolio | `profile` / linki społecznościowe |

Frontend nie powinien wyświetlać technicznych nazw angielskich. Powinien też bezpiecznie obsłużyć nieznaną nazwę sekcji zamiast przerywać renderowanie.

## Hierarchia widoku

### 1. Nagłówek panelu

- tytuł: „Analiza jakości CV”;
- nazwa analizowanego CV;
- stanowisko docelowe, jeśli istnieje;
- akcja główna: „Analizuj CV” albo „Analizuj ponownie”;
- krótka informacja o koszcie, jeśli frontend ma dostęp do aktualnego kosztu usługi;
- możliwość zamknięcia panelu bez utraty danych formularza.

Nie należy wpisywać kosztu na stałe w UI. Jeśli koszt nie jest dostępny z API, użyć neutralnego komunikatu: „Analiza może wykorzystać środki z Twojego planu”.

### 2. Podsumowanie wyniku

Najważniejszym elementem jest `overallScore` przedstawiony jako czytelna liczba `74/100`. Można użyć pierścienia postępu, ale wynik musi być dostępny również tekstowo.

Proponowane poziomy prezentacyjne:

- 0–39: „Wymaga uzupełnienia”;
- 40–69: „Dobry fundament”;
- 70–84: „Dobre CV”;
- 85–100: „Bardzo mocne CV”.

Kolor nie może być jedynym nośnikiem informacji. Każdy poziom powinien mieć tekst i ikonę. Należy unikać agresywnego czerwonego komunikatu dla niskiego wyniku — funkcja ma motywować do działania, nie karać.

Jeśli CV ma ustawione `targetPosition`, obok wyniku ogólnego pokazać `targetPositionScore` jako „Dopasowanie do: {targetPosition}”. Jeśli stanowiska nie ustawiono, nie pokazywać wyniku `0%`. Zamiast niego wyświetlić kartę CTA:

> Ustaw stanowisko docelowe, aby sprawdzić dopasowanie CV.

### 3. Najważniejsze poprawki

Sekcja „Największy wpływ” pokazuje `topImprovements` jako maksymalnie trzy numerowane zadania. Każde zadanie powinno mieć:

- krótką treść rekomendacji;
- status lokalny „Do zrobienia” — bez zapisywania statusu na backendzie;
- przycisk „Przejdź do sekcji”, jeśli można wiarygodnie ustalić docelową sekcję;
- brak automatycznej obietnicy, o ile punktów wzrośnie wynik — backend tego nie zwraca.

Nie dodawać checkboxa sugerującego trwałe ukończenie zadania, dopóki backend nie przechowuje tego stanu. Lokalny checkbox może służyć wyłącznie jako tymczasowa pomoc w bieżącej sesji i powinien być wyraźnie opisany.

### 4. Wyniki sekcji

Pokaż osiem kart lub jeden akordeon posortowany od najniższego wyniku do najwyższego. Każdy element zawiera:

- polską nazwę sekcji;
- wynik `score/100`;
- pasek postępu;
- listę `insights`;
- akcję „Popraw sekcję” przewijającą edytor do odpowiedniego formularza.

Na desktopie rekomendowany jest kompaktowy akordeon w panelu bocznym. Na osobnym ekranie można użyć siatki kart. Nie stosować wykresu radarowego jako jedynego widoku — jest trudniejszy do odczytania i nie pokazuje rekomendacji.

Sekcja z wynikiem `0` i informacją o braku danych powinna otrzymać jasne CTA „Uzupełnij”, zamiast wyłącznie komunikatu o błędzie.

## Stany interfejsu

### Brak wcześniejszej analizy

- krótko wyjaśnić, co zostanie ocenione;
- pokazać osiem analizowanych obszarów;
- główne CTA: „Analizuj CV”;
- poinformować, że analiza ocenia treść CV, nie finalny PDF;
- błąd pobrania oznaczający brak analizy traktować jako prawidłowy empty state, nie jako awarię.

### Analizowanie

- zablokować wielokrotne wysłanie żądania;
- pozostawić możliwość dalszego przeglądania CV, jeśli implementacja na to pozwala;
- użyć komunikatów etapowych, np. „Sprawdzamy kompletność sekcji”, „Oceniamy doświadczenie i osiągnięcia”, „Tworzymy priorytety zmian”;
- nie pokazywać fałszywego procentu postępu, ponieważ backend nie raportuje progresu;
- uwzględnić czas oczekiwania do około 3 minut i nie przerywać żądania po typowym krótkim timeoutcie frontendu.

### Sukces

- płynnie przejść do podsumowania;
- po pierwszej analizie wyróżnić trzy najważniejsze poprawki;
- zachować wynik po zamknięciu panelu i pobierać go przez endpoint `GET` przy kolejnym wejściu.

### Błąd

Rozróżnić co najmniej:

- brak dostępu lub wygasła sesja;
- niewystarczające środki/ograniczenie planu;
- CV nie istnieje;
- błąd usługi AI lub sieci;
- niepoprawna odpowiedź serwera.

Komunikat powinien zawierać krótkie wyjaśnienie i bezpieczną akcję „Spróbuj ponownie”. Nie usuwać poprzedniego poprawnego wyniku, jeśli ponowna analiza się nie udała.

### Brak stanowiska docelowego

- `targetPositionScore: 0` nie oznacza słabego dopasowania;
- ukryć liczbowy wynik;
- pokazać CTA prowadzące do pola stanowiska docelowego.

### Edycja CV po analizie

Aktualny endpoint nie zwraca wersji ani daty analizy, dlatego frontend nie jest dziś w stanie wiarygodnie oznaczyć wyniku jako nieaktualny. Do czasu rozszerzenia API nie należy zgadywać na podstawie czasu lokalnego.

## Zachowanie i nawigacja

- Otwarcie analizy najpierw wywołuje `GET /api/cvs/analysis/{cvId}`.
- Brak wyniku pokazuje empty state.
- Kliknięcie „Analizuj CV” wywołuje `POST /api/cvs/analyze/{cvId}`.
- Kliknięcie „Popraw sekcję” zamyka lub minimalizuje panel i przewija formularz do sekcji.
- Po zapisaniu zmian użytkownik może ręcznie wybrać „Analizuj ponownie”. Analiza nie powinna uruchamiać się przy autosave.
- Nie należy automatycznie uruchamiać płatnej analizy przy otwarciu strony.
- Wynik po stronie frontendu powinien zostać ograniczony wizualnie do zakresu 0–100, aby nietypowa odpowiedź AI nie zepsuła layoutu.

## Kierunek wizualny

Projekt musi być spójny z istniejącym interfejsem Vocare:

- React/Next.js, Tailwind CSS i komponenty shadcn/ui;
- ikony Lucide;
- fonty i typografia zgodne z ekranem edytora (`font-grotesk` / obecne tokeny aplikacji);
- główny akcent: fiolet `#915EFF` oraz jego półprzezroczyste warianty;
- zaokrąglone karty, subtelne obramowania, spokojne cienie;
- pełna obsługa jasnego i ciemnego motywu;
- używać tokenów `background`, `foreground`, `muted`, `muted-foreground`, `border` zamiast mnożenia sztywnych kolorów;
- animacje krótkie i funkcjonalne, respektujące `prefers-reduced-motion`;
- nie przeciążać widoku gradientami, szkłem ani dekoracyjnymi wykresami.

Wynik ma wyglądać jak pomocny audyt i lista działań, nie jak ekran egzaminu lub system grywalizacji.

## Responsywność

### Desktop

- edytor pozostaje głównym obszarem;
- analiza otwiera się jako prawy panel o szerokości około 400–480 px;
- panel ma własny scroll;
- akcje przejścia do sekcji zachowują kontekst edycji.

### Tablet

- panel może zajmować 45–55% szerokości albo otwierać się jako dialog;
- podsumowanie wyników układa się w jedną lub dwie kolumny zależnie od miejsca.

### Mobile

- pełnoekranowy sheet/dialog;
- sticky nagłówek z zamknięciem;
- sticky dolne CTA tylko w empty state i stanie błędu;
- elementy dotykowe minimum 44 × 44 px;
- żadnych informacji dostępnych wyłącznie przez hover.

## Dostępność

- wszystkie wyniki muszą mieć tekstowe etykiety;
- paski postępu powinny mieć `aria-valuenow`, `aria-valuemin` i `aria-valuemax`;
- kontrast zgodny co najmniej z WCAG AA;
- logiczna kolejność nagłówków;
- focus wraca do przycisku otwierającego po zamknięciu panelu;
- po zakończeniu analizy użyć dyskretnego `aria-live`, np. „Analiza CV jest gotowa”;
- rozwijane sekcje muszą działać z klawiatury;
- loading nie może opierać się wyłącznie na animacji.

## Teksty interfejsu

Rekomendowane sformułowania:

- „Analiza jakości CV”
- „Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności.”
- „Wynik ogólny”
- „Dopasowanie do stanowiska”
- „Największy wpływ”
- „Ocena sekcji”
- „Popraw sekcję”
- „Analizuj CV”
- „Analizuj ponownie”
- „Analiza może wykorzystać środki z Twojego planu.”
- „Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS.”

Unikać tekstów:

- „Twoje CV przejdzie każdy ATS”;
- „Masz 80% szans na zatrudnienie”;
- „Gwarantowany sukces”;
- „AI znalazło wszystkie błędy”.

## Rozszerzenia backendu rekomendowane przed pełnym wdrożeniem

Najbardziej użyteczna docelowa odpowiedź API:

```ts
interface CvAnalysisResponse extends CvAnalysisResult {
  cvId: string;
  cvVersionAtAnalysis: number;
  currentCvVersion: number;
  analyzedAt: string;
  isOutdated: boolean;
}
```

Dodatkowo warto:

1. zwracać datę i wersję analizy w endpointzie `GET`;
2. dodać ścisłą walidację zakresów 0–100 i wymaganych nazw sekcji;
3. zapewnić unikalny indeks bazy dla jednego aktywnego wyniku na `CvId` albo świadomie wprowadzić historię analiz;
4. dodać stabilne `sectionId` i opcjonalne `insightId`;
5. udostępnić koszt `AnalyzeCv` przez API zamiast wpisywać go w frontendzie;
6. jeśli potrzebny jest prawdziwy test ATS, stworzyć osobny proces analizujący finalny PDF: warstwę tekstową, kolejność odczytu, nagłówki, kolumny i parsowalność.

## Kryteria akceptacji projektu UI/UX

- Użytkownik rozumie różnicę między wynikiem ogólnym a dopasowaniem do stanowiska.
- Brak stanowiska nie wygląda jak wynik `0%`.
- W ciągu kilku sekund użytkownik potrafi wskazać trzy najważniejsze poprawki.
- Każda oceniona sekcja ma wynik, rekomendacje i drogę powrotu do edycji.
- Projekt obejmuje empty, loading, success, error, brak środków i brak stanowiska.
- UI nie sugeruje gwarancji ATS ani szansy zatrudnienia.
- Ponowna analiza wymaga świadomej akcji użytkownika.
- Projekt działa w jasnym i ciemnym motywie oraz na desktopie i mobile.
- Kreator dostarcza widok wraz z nazwami komponentów/stref i wariantami responsywnymi, a nie tylko statyczny ekran sukcesu.
