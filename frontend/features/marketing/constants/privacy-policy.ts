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
        'Dane osobowe przetwarzamy zgodnie z rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO), ustawą z dnia 10 maja 2018 r. o ochronie danych osobowych oraz ustawą z dnia 12 lipca 2024 r. - Prawo komunikacji elektronicznej.',
      ],
    },
    {
      title: 'Administrator danych osobowych',
      points: [
        `Administratorem Twoich danych osobowych jest ${name}, wykonujący działalność nierejestrowaną zgodnie z art. 5 ust. 1 ustawy - Prawo przedsiębiorców (dalej: „Administrator”).`,
        ...(address ? [`Adres do doręczeń: ${address}.`] : []),
        `Kontakt w sprawach danych osobowych: ${email}. Odpowiadamy niezwłocznie, z reguły w ciągu 48 godzin w dni robocze, a na wnioski dotyczące realizacji Twoich praw - nie później niż w ciągu miesiąca.`,
        'Administrator nie powołał Inspektora Ochrony Danych.',
      ],
    },
    {
      title: 'Zakres, cele i podstawy prawne przetwarzania',
      points: [
        'Przetwarzamy wyłącznie dane niezbędne do realizacji celów opisanych poniżej.',
        'Prowadzenie Konta i świadczenie Usług (art. 6 ust. 1 lit. b RODO - wykonanie umowy). Dane: imię i nazwisko, adres e-mail, hasło (przechowywane wyłącznie w postaci skrótu kryptograficznego), dane z profilu i CV (wykształcenie, doświadczenie zawodowe, umiejętności, oczekiwania finansowe), treści wprowadzane do Funkcji AI, historia analiz. W przypadku logowania przez Google otrzymujemy od Google imię, nazwisko i adres e-mail.',
        'Ważne: prosimy o niepodawanie w profilu, CV ani zapytaniach do AI danych szczególnych kategorii (np. o stanie zdrowia, wyznaniu, poglądach politycznych) ani danych osób trzecich, jeżeli nie masz do tego podstawy.',
        'Płatności i rozliczenia (art. 6 ust. 1 lit. b RODO oraz art. 6 ust. 1 lit. c RODO - obowiązki wynikające z przepisów podatkowych). Dane: imię i nazwisko, adres e-mail, dane transakcji. Danych karty płatniczej nie przetwarzamy - obsługuje je operator płatności.',
        'Przesłanie potwierdzenia zawarcia umowy na trwałym nośniku (art. 6 ust. 1 lit. c RODO w zw. z art. 21 ust. 1 ustawy o prawach konsumenta).',
        'Rozpatrywanie reklamacji, wniosków i zgłoszeń, w tym zgłoszeń nielegalnych treści (art. 6 ust. 1 lit. c RODO), oraz ustalenie, dochodzenie i obrona roszczeń (art. 6 ust. 1 lit. f RODO - prawnie uzasadniony interes).',
        'Marketing bezpośredni drogą elektroniczną (art. 6 ust. 1 lit. a RODO - zgoda, oraz art. 398 Prawa komunikacji elektronicznej). Dane: imię i adres e-mail. Zgoda jest dobrowolna i odrębna od akceptacji Regulaminu. Za jej wyrażenie przyznajemy jednorazowo rabat na zakup Pakietu Tokenów na zasadach Regulaminu; wycofanie zgody nie powoduje utraty przyznanego rabatu.',
        'Statystyka ruchu w Serwisie (art. 6 ust. 1 lit. a RODO - zgoda na cookies analityczne wyrażona w banerze cookies). Dane: identyfikatory plików cookies, informacje o urządzeniu i przeglądarce, przybliżona lokalizacja, sposób korzystania z Serwisu.',
        'Pomiar skuteczności naszych reklam w serwisach TikTok, Facebook i Instagram oraz kierowanie tych reklam do osób, które odwiedziły Serwis lub mogą być nim zainteresowane (art. 6 ust. 1 lit. a RODO - zgoda na cookies reklamowe wyrażona w banerze cookies). Dane zbierane przez piksele TikToka i Mety: identyfikatory plików cookies i urządzenia, adres IP, informacje o przeglądarce, adresy odwiedzanych stron Serwisu, informacje o zaangażowaniu w wizytę (np. o czasie spędzonym na stronie) oraz informacje o wykonanych działaniach - wejściu na stronę cennika, rejestracji, rozpoczęciu płatności, rozpoczęciu Okresu próbnego, zakupie (wybrany plan i jego cena), pobraniu CV i skorzystaniu z kalkulatora wynagrodzeń. Nie przekazujemy w tym celu Twojego imienia i nazwiska, adresu e-mail, numeru telefonu, treści profilu i CV ani kwot wpisanych w kalkulatorze. TikTok i Meta mogą powiązać te dane z Twoim kontem w swoich serwisach, jeśli je masz.',
        'Bezpieczeństwo Serwisu (art. 6 ust. 1 lit. f RODO - prawnie uzasadniony interes). Dane: adres IP, logi serwera, czas wizyty. Cel: wykrywanie nadużyć, ochrona przed atakami i poprawa stabilności Serwisu.',
        'Dokumentowanie akceptacji Regulaminu, zapoznania się z Polityką Prywatności oraz wyrażenia i wycofania zgód (art. 6 ust. 1 lit. c i f RODO). Dane: wersja zaakceptowanego dokumentu, data, adres IP, informacja o przeglądarce (User-Agent), źródło i treść zgody. Przy decyzjach dotyczących cookies zapisujemy identyfikator z pliku cookie consent_id, Twoje wybory, miejsce ich dokonania (baner, preferencje lub ustawienia Konta), wersję treści, na podstawie której ich dokonałeś, datę oraz - jeśli jesteś zalogowany - identyfikator Konta. Nie zapisujemy przy tym adresu IP ani informacji o przeglądarce.',
        'Zapobieganie wielokrotnemu uzyskiwaniu jednorazowych korzyści - rabatu za zgodę marketingową, Okresu próbnego Subskrypcji Premium oraz przyznawanych wcześniej Tokenów powitalnych - i powiązanie historii zgód z usuniętym Kontem (art. 6 ust. 1 lit. f RODO - prawnie uzasadniony interes). Po usunięciu Konta przechowujemy jednokierunkowy skrót (hash HMAC) adresu e-mail, z którego nie da się odtworzyć adresu, wraz z informacją, czy z Konta przypisanego do tego adresu przyznano już Tokeny powitalne lub rabat za zgodę marketingową oraz czy korzystano z Subskrypcji Premium (w tym z Okresu próbnego). Dla Kont usuniętych przed wprowadzeniem Okresu próbnego i rabatu tę informację ustaliliśmy na podstawie przechowywanej historii transakcji. Pozwala to rozpoznać ponowną rejestrację na ten sam adres e-mail.',
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
            'Railway Corporation (USA) - hosting aplikacji i bazy danych,',
            'Vercel Inc. (USA) - hosting interfejsu Serwisu,',
            'OpenAI Ireland Ltd / OpenAI, L.L.C. (USA) - modele sztucznej inteligencji,',
            'Resend (USA) - wysyłka wiadomości e-mail,',
            'Stripe Payments Europe, Limited (Irlandia) - obsługa płatności,',
            'Google Ireland Limited - logowanie przez Google oraz Google Analytics (wyłącznie po wyrażeniu zgody na cookies analityczne).',
          ],
        },
        {
          text: 'Jeżeli wyrazisz zgodę na cookies reklamowe, dane zbierane przez piksele otrzymują także:',
          items: [
            'TikTok Technology Limited (Irlandia) i TikTok Information Technologies UK Limited (Wielka Brytania) - piksel TikTok,',
            'Meta Platforms Ireland Limited (Irlandia) - piksel Meta (Facebook, Instagram).',
          ],
        },
        'Z tymi podmiotami jesteśmy współadministratorami danych (art. 26 RODO) w zakresie zbierania danych za pomocą pikseli i przekazywania ich TikTokowi i Mecie, a w przypadku TikToka także w zakresie pomiaru skuteczności reklam i przygotowywania raportów. Uzgodniliśmy z nimi podział obowiązków: my informujemy Cię o tym przetwarzaniu i odpowiadamy za uzyskanie Twojej zgody, a TikTok i Meta umożliwiają realizację Twoich praw, o których mowa w art. 15-20 RODO, wobec danych, które przechowują po ich otrzymaniu. Niezależnie od tych uzgodnień swoje prawa możesz realizować zarówno wobec nas, jak i bezpośrednio wobec TikToka i Mety.',
        'Dalsze przetwarzanie tych danych, w tym tworzenie grup odbiorców i wyświetlanie reklam, TikTok i Meta prowadzą jako odrębni administratorzy. Ich dane kontaktowe (w tym dane kontaktowe inspektorów ochrony danych), podstawy prawne, z których korzystają, oraz sposób realizacji Twoich praw wobec nich opisują ich polityki prywatności: https://www.tiktok.com/legal/page/eea/privacy-policy/pl oraz https://www.facebook.com/privacy/policy. W tym zakresie mogą też przekazywać dane poza EOG.',
        'Część odbiorców ma siedzibę w USA lub korzysta z podwykonawców w USA. Przekazanie danych odbywa się na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy Framework) - w przypadku odbiorców objętych tym programem - albo standardowych klauzul umownych zatwierdzonych przez Komisję Europejską (art. 46 ust. 2 lit. c RODO). Przekazanie danych do TikTok Information Technologies UK Limited odbywa się na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony danych w Wielkiej Brytanii. Kopię zabezpieczeń możesz otrzymać, kontaktując się z Administratorem.',
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
        'Zapisy Twoich decyzji dotyczących cookies przechowujemy przez 3 lata od dokonania danego wyboru, a następnie automatycznie usuwamy.',
        'Dane o zdarzeniach i użytkownikach są przechowywane w Google Analytics przez 14 miesięcy, a następnie automatycznie usuwane. Zagregowane statystyki, które nie pozwalają Cię zidentyfikować, mogą być przechowywane dłużej.',
        'Danych zebranych przez piksele TikToka i Mety sami nie przechowujemy. TikTok przechowuje dane o zdarzeniach z piksela przez maksymalnie 18 miesięcy, a okres ich przechowywania przez Metę określa jej polityka prywatności.',
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
        `Aby skorzystać ze swoich praw, napisz na adres ${email}. Zgodę marketingową oraz zgody na cookies analityczne i reklamowe możesz także zmienić w ustawieniach Konta, a zgody na cookies - również na stronie vocare.pl/preferences.`,
        'Podanie danych jest dobrowolne, ale niezbędne do założenia Konta i korzystania z Usług. Podanie danych w celach marketingowych, statystycznych i reklamowych nie jest warunkiem korzystania z Serwisu.',
      ],
    },
    {
      title: 'Pliki cookies',
      points: [
        'Serwis używa plików cookies - małych plików tekstowych zapisywanych na Twoim urządzeniu.',
        'Cookies niezbędne służą do utrzymania sesji zalogowanego Użytkownika, zapewnienia bezpieczeństwa oraz zapamiętania Twoich decyzji dotyczących cookies. Nie wymagają zgody.',
        {
          text: 'Cookies niezbędne (ustawiamy je my i tylko my mamy do nich dostęp):',
          items: [
            'token, userId - utrzymanie sesji zalogowanego Użytkownika, 1 godzina,',
            'cookie_consent, ads_consent - zapamiętanie Twoich decyzji dotyczących cookies, 12 miesięcy,',
            'consent_id - losowy identyfikator, który łączy Twoje decyzje dotyczące cookies z ich zapisem po naszej stronie (dowód wyrażenia lub wycofania zgody), 12 miesięcy,',
            'oAuthState, oauthCallbackUrl - bezpieczne logowanie przez Google, 10 minut,',
            'reset_password - obsługa linku do zmiany hasła, 1 godzina,',
            'sidebar_state - zapamiętanie, czy menu boczne jest zwinięte, 7 dni.',
          ],
        },
        'Cookies analityczne (Google Analytics) są używane wyłącznie po wyrażeniu na nie zgody w banerze cookies. Bez tej zgody skrypt Google Analytics nie jest wczytywany, a Google Analytics nie otrzymuje żadnych informacji o Twojej wizycie.',
        {
          text: 'Cookies analityczne (dostęp do nich ma Google):',
          items: [
            '_ga, _ga_<identyfikator> - rozróżnianie użytkowników i wizyt w statystykach, 13 miesięcy.',
          ],
        },
        'Cookies reklamowe (piksele TikToka i Mety) są używane wyłącznie po wyrażeniu na nie zgody w banerze cookies. Bez tej zgody skrypty pikseli nie są wczytywane, a do TikToka i Mety nie trafiają żadne informacje o Twojej wizycie.',
        {
          text: 'Cookies reklamowe (dostęp do nich mają odpowiednio Meta i TikTok):',
          items: [
            '_fbp, _fbc (Meta) - rozpoznanie przeglądarki i kliknięcia w reklamę, 90 dni,',
            '_ttp, _tt_enable_cookie (TikTok) - rozpoznanie przeglądarki na potrzeby pomiaru reklam, 90 dni,',
            'ttclid (TikTok) - zapamiętanie kliknięcia w reklamę, 1 dzień.',
          ],
        },
        'Jeżeli wyrazisz zgodę na cookies analityczne lub reklamowe, korzystamy też z dwóch krótkotrwałych zapisów pomocniczych, które przekazują narzędziom objętym Twoją zgodą informację o rejestracji lub zakupie: pliku cookie new_oauth_user (po rejestracji przez Google, 5 minut) oraz wpisu pending_checkout w pamięci sesji przeglądarki (od rozpoczęcia płatności do powrotu z serwisu płatności, najdłużej do zamknięcia karty przeglądarki). Bez zgody nie zapisujemy ich na Twoim urządzeniu.',
        'Piksele zapisują też w pamięci przeglądarki (localStorage i sessionStorage) informacje o kliknięciu w reklamę i bieżącej wizycie. TikTok może ponadto zapisać plik cookie _ttp we własnej domenie (tiktok.com). Okresy ważności plików cookies TikToka i Mety określają te podmioty i mogą się one zmienić.',
        'Zgody na cookies analityczne i reklamowe są od siebie niezależne - możesz wyrazić jedną bez drugiej.',
        'Zgody na cookies możesz w każdej chwili zmienić lub wycofać w ustawieniach Konta, na stronie vocare.pl/preferences albo usuwając pliki cookies w przeglądarce, co spowoduje ponowne wyświetlenie banera. Możesz też zablokować cookies w ustawieniach przeglądarki, co może jednak utrudnić korzystanie z Serwisu.',
        'Po wycofaniu zgody usuwamy z Twojej przeglądarki pliki cookies i dane zapisane w domenie vocare.pl przez narzędzie, którego zgoda dotyczyła. Plików cookies zapisanych przez TikToka lub Metę w ich własnych domenach nie możemy usunąć - możesz to zrobić w ustawieniach przeglądarki.',
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
