| Folder      | Główna odpowiedzialność | Zależności                                    |
|--------     |------------------------|------------                                    |
| models/     | Struktury danych                   | Brak                               |
| screens/    | Ekrany aplikacji (UI)              | widgets/, services/, repositories/ |
| widgets/    | Komponenty UI wielokrotnego użytku | models/                            |
| services/   | Komunikacja z backend (API calls)  | models/                            |
| repositories| Logika biznesowa (pośrednik)       | services/                          |
| utils       | Funkcje pomocnicze (error handling)| Brak                               |