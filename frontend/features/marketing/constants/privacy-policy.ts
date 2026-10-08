import { PRIVACY_POLICY_LAST_UPDATED, SERVICE_PROVIDER } from './legal';
import type { LegalSection } from './terms-of-service';

const { name, email, address } = SERVICE_PROVIDER;

export const privacy_policy: {
  title: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
} = {
  title: 'Polityka Prywatności i plików cookies serwisu vocare.pl',
  lastUpdated: PRIVACY_POLICY_LAST_UPDATED,
  sections: [
    {
      title: 'Postanowienia wstępne',
      points: [
        'Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych Użytkowników serwisu internetowego vocare.pl (dalej: „Serwis”) oraz zasady korzystania z plików cookies.',
        'Dane osobowe przetwarzamy zgodnie z rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO), ustawą z dnia 10 maja 2018 r. o ochronie danych osobowych oraz ustawą z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej.',
      ],
    },
    {
      title: 'Administrator danych osobowych',
      points: [
        `Administratorem Twoich danych osobowych jest ${name}, wykonujący działalność nierejestrowaną zgodnie z art. 5 ust. 1 ustawy – Prawo przedsiębiorców (dalej: „Administrator”).`,
        ...(address ? [`Adres do doręczeń: ${address}.`] : []),
        `Kontakt w sprawach danych osobowych: ${email}. Odpowiadamy niezwłocznie, z reguły w ciągu 48 godzin w dni robocze, a na wnioski dotyczące realizacji Twoich praw – nie później niż w ciągu miesiąca.`,
        'Administrator nie powołał Inspektora Ochrony Danych.',
      ],
    },
    {
      title: 'Zakres, cele i podstawy prawne przetwarzania',
      points: [
        'Przetwarzamy wyłącznie dane niezbędne do realizacji celów opisanych poniżej.',
        'Prowadzenie Konta i świadczenie Usług (art. 6 ust. 1 lit. b RODO – wykonanie umowy). Dane: imię i nazwisko, adres e-mail, hasło (przechowywane wyłącznie w postaci skrótu kryptograficznego), dane z profilu i CV (wykształcenie, doświadczenie zawodowe, umiejętności, oczekiwania finansowe), treści wprowadzane do Funkcji AI, historia analiz. W przypadku logowania przez Google lub LinkedIn otrzymujemy od tych serwisów imię, nazwisko i adres e-mail.',
        'Ważne: prosimy o niepodawanie w profilu, CV ani zapytaniach do AI danych szczególnych kategorii (np. o stanie zdrowia, wyznaniu, poglądach politycznych) ani danych osób trzecich, jeżeli nie masz do tego podstawy.',
        'Płatności i rozliczenia (art. 6 ust. 1 lit. b RODO oraz art. 6 ust. 1 lit. c RODO – obowiązki wynikające z przepisów podatkowych). Dane: imię i nazwisko, adres e-mail, dane transakcji. Danych karty płatniczej nie przetwarzamy – obsługuje je operator płatności.',
        'Przesłanie potwierdzenia zawarcia umowy na trwałym nośniku (art. 6 ust. 1 lit. c RODO w zw. z art. 21 ust. 1 ustawy o prawach konsumenta).',
        'Rozpatrywanie reklamacji, wniosków i zgłoszeń, w tym zgłoszeń nielegalnych treści (art. 6 ust. 1 lit. c RODO), oraz ustalenie, dochodzenie i obrona roszczeń (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes).',
        'Marketing bezpośredni drogą elektroniczną (art. 6 ust. 1 lit. a RODO – zgoda, oraz art. 398 Prawa komunikacji elektronicznej). Dane: imię i adres e-mail. Zgoda jest dobrowolna i odrębna od akceptacji Regulaminu. Za jej wyrażenie przyznajemy jednorazowo Tokeny powitalne na zasadach Regulaminu; wycofanie zgody nie powoduje ich odebrania.',
        'Statystyka ruchu w Serwisie (art. 6 ust. 1 lit. a RODO – zgoda wyrażona w banerze cookies). Dane: identyfikatory plików cookies, informacje o urządzeniu i przeglądarce, przybliżona lokalizacja, sposób korzystania z Serwisu.',
        'Bezpieczeństwo Serwisu (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes). Dane: adres IP, logi serwera, czas wizyty. Cel: wykrywanie nadużyć, ochrona przed atakami i poprawa stabilności Serwisu.',
        'Dokumentowanie akceptacji Regulaminu, zapoznania się z Polityką Prywatności oraz wyrażenia i wycofania zgód (art. 6 ust. 1 lit. c i f RODO). Dane: wersja zaakceptowanego dokumentu, data, adres IP, informacja o przeglądarce (User-Agent), źródło i treść zgody.',
        'Zapobieganie wielokrotnemu uzyskiwaniu Tokenów powitalnych i powiązanie historii zgód z usuniętym Kontem (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes). Po usunięciu Konta przechowujemy jednokierunkowy skrót (hash HMAC) adresu e-mail, z którego nie da się odtworzyć adresu, wraz z informacją, że Tokeny powitalne zostały już wykorzystane. Pozwala to rozpoznać ponowną rejestrację na ten sam adres e-mail.',
      ],
    },
    {
      title: 'Sztuczna inteligencja i zautomatyzowane podejmowanie decyzji',
      points: [
        'Serwis wykorzystuje modele językowe OpenAI do wykonywania Funkcji AI. Przekazujemy mu wyłącznie dane niezbędne do wykonania danej funkcji. Do przygotowywania ogólnych analiz rynku pracy korzystamy także z narzędzi Perplexity AI, którym nie przekazujemy Twoich danych osobowych.',
        'Zgodnie z warunkami usługi API OpenAI dane przesyłane przez API nie są wykorzystywane do trenowania modeli. OpenAI może przechowywać je przez okres do 30 dni w celu wykrywania nadużyć, po czym są usuwane.',
        'Serwis nie podejmuje wobec Ciebie decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby wobec Ciebie skutki prawne lub w podobny sposób istotnie na Ciebie wpływały (art. 22 RODO). Wyniki generowane przez AI są sugestiami, które należy samodzielnie zweryfikować. Decyzja o wyborze ścieżki kariery zawsze należy do Ciebie.',
      ],
    },
    {
      title: 'Odbiorcy danych i przekazywanie danych poza EOG',
      points: [
        'Dane powierzamy podmiotom, które wspierają nas technicznie i przetwarzają je w naszym imieniu na podstawie umów powierzenia przetwarzania danych.',
        {
          text: 'Odbiorcami danych są:',
          items: [
            'Railway Corporation (USA) – hosting aplikacji i bazy danych,',
            'Vercel Inc. (USA) – hosting interfejsu Serwisu,',
            'OpenAI Ireland Ltd / OpenAI, L.L.C. (USA) – modele sztucznej inteligencji,',
            'Resend (USA) – wysyłka wiadomości e-mail,',
            'Stripe Payments Europe, Limited (Irlandia) – obsługa płatności,',
            'Google Ireland Limited – logowanie przez Google oraz Google Analytics (wyłącznie po wyrażeniu zgody na cookies analityczne),',
            'LinkedIn Ireland Unlimited Company – logowanie przez LinkedIn.',
          ],
        },
        'Część odbiorców ma siedzibę w USA lub korzysta z podwykonawców w USA. Przekazanie danych odbywa się na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy Framework) – w przypadku odbiorców objętych tym programem – albo standardowych klauzul umownych zatwierdzonych przez Komisję Europejską (art. 46 ust. 2 lit. c RODO). Kopię zabezpieczeń możesz otrzymać, kontaktując się z Administratorem.',
        'Dane możemy udostępnić organom publicznym wyłącznie wtedy, gdy obowiązek taki wynika z przepisów prawa.',
      ],
    },
    {
      title: 'Okres przechowywania danych',
      points: [
        'Dane związane z Kontem przechowujemy przez czas jego istnienia.',
        'Po usunięciu Konta niezwłocznie usuwamy dane profilu, CV, roadmapy, powiadomienia i dane logowania, a konto zostaje zanonimizowane. Dłużej przechowujemy wyłącznie dane wskazane w kolejnych punktach.',
        'Dane dotyczące zawartych umów i płatności mogą być przechowywane do upływu okresu przedawnienia roszczeń, wyłącznie w zakresie niezbędnym do ich ustalenia, dochodzenia lub obrony.',
        'Dane rozliczeniowe przechowujemy przez 5 lat od końca roku kalendarzowego, w którym powstał obowiązek podatkowy.',
        'Dane przetwarzane na podstawie zgody marketingowej wykorzystujemy do czasu jej wycofania albo usunięcia Konta (usunięcie Konta oznacza wycofanie zgody).',
        'Historię akceptacji dokumentów i zgód oraz skrót adresu e-mail usuniętego Konta przechowujemy przez 6 lat od usunięcia Konta (ogólny termin przedawnienia roszczeń), a następnie automatycznie usuwamy.',
        'Dane statystyczne z Google Analytics są przechowywane przez 14 miesięcy, a następnie automatycznie usuwane.',
      ],
    },
    {
      title: 'Twoje prawa',
      points: [
        {
          text: 'Przysługuje Ci prawo do:',
          items: [
            'dostępu do swoich danych oraz otrzymania ich kopii,',
            'sprostowania (poprawiania) danych,',
            'usunięcia danych („prawo do bycia zapomnianym”), jeżeli nie ma innej podstawy prawnej ich przetwarzania,',
            'ograniczenia przetwarzania danych,',
            'przenoszenia danych,',
            'wniesienia sprzeciwu wobec przetwarzania danych na podstawie prawnie uzasadnionego interesu,',
            'cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem,',
            'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa), jeśli uznasz, że przetwarzanie narusza RODO.',
          ],
        },
        `Aby skorzystać ze swoich praw, napisz na adres ${email}. Zgodę marketingową i zgodę na cookies analityczne możesz także zmienić w ustawieniach Konta.`,
        'Podanie danych jest dobrowolne, ale niezbędne do założenia Konta i korzystania z Usług. Podanie danych w celach marketingowych i statystycznych nie jest warunkiem korzystania z Serwisu.',
      ],
    },
    {
      title: 'Pliki cookies',
      points: [
        'Serwis używa plików cookies – małych plików tekstowych zapisywanych na Twoim urządzeniu.',
        'Cookies niezbędne służą do utrzymania sesji zalogowanego Użytkownika, zapewnienia bezpieczeństwa oraz zapamiętania Twojej decyzji dotyczącej cookies. Nie wymagają zgody.',
        'Cookies analityczne (Google Analytics) są używane wyłącznie po wyrażeniu zgody w banerze cookies. Bez zgody Google Analytics działa w trybie ograniczonym (Consent Mode) i nie zapisuje analitycznych plików cookies.',
        'Zgodę na cookies analityczne możesz w każdej chwili wycofać w ustawieniach Konta albo usuwając pliki cookies w przeglądarce, co spowoduje ponowne wyświetlenie banera. Możesz też zablokować cookies w ustawieniach przeglądarki, co może jednak utrudnić korzystanie z Serwisu.',
      ],
    },
    {
      title: 'Zmiany Polityki Prywatności',
      points: [
        'Administrator może zmienić Politykę Prywatności w razie zmian w przepisach prawa, technologii lub sposobie działania Serwisu.',
        'O istotnych zmianach poinformujemy komunikatem w Serwisie lub wiadomością e-mail.',
      ],
    },
  ],
};
