// Archiwalna wersja Regulaminu obowiązująca od 13.10.2026 do 16.11.2026. Nie edytować.
import type { LegalSection } from './terms-of-service';

// Daty zamrożone razem z treścią – nie czytamy ich z TERMS_VERSION, bo ten wskazuje zawsze
// bieżącą wersję. Do czasu wdrożenia muszą zgadzać się z TERMS_VERSION w legal.ts.
export const termsOfService20261013Validity =
  'Wersja archiwalna obowiązująca od 13.10.2026 (wobec Użytkowników, którzy zawarli umowę wcześniej, od 28.10.2026). Wobec Użytkowników, którzy zawarli umowę przed 02.11.2026, stosuje się ją do 16.11.2026.';

export const termsOfService20261013: readonly LegalSection[] = [
  {
    title: 'Postanowienia ogólne',
    points: [
      'Niniejszy Regulamin określa zasady korzystania z serwisu internetowego dostępnego pod adresem vocare.pl, rodzaje i zakres usług świadczonych drogą elektroniczną, warunki zawierania i rozwiązywania umów oraz tryb postępowania reklamacyjnego. Jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.',
      'Usługodawcą i właścicielem Serwisu jest Kacper Jóźwik, wykonujący działalność nierejestrowaną w rozumieniu art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców.',
      'Kontakt z Usługodawcą jest możliwy pod adresem e-mail: kontakt@vocare.pl. Usługodawca odpowiada na wiadomości niezwłocznie, z reguły w ciągu 48 godzin w dni robocze. Terminy rozpatrzenia reklamacji i wniosków określają § 11, § 12 i § 13.',
      'Działalność Usługodawcy nie podlega wpisowi do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG), ponieważ przychód należny z tej działalności nie przekracza w żadnym kwartale 225% kwoty minimalnego wynagrodzenia za pracę.',
      'Usługodawca korzysta ze zwolnienia podmiotowego z podatku od towarów i usług (art. 113 ust. 1 ustawy o podatku od towarów i usług). Ceny podane w Serwisie są cenami końcowymi.',
      'Regulamin jest udostępniany nieodpłatnie przed zawarciem umowy, w sposób umożliwiający jego pozyskanie, odtwarzanie i utrwalanie, w szczególności przez wydruk lub zapis strony w formacie PDF z poziomu przeglądarki.',
      'Usługi świadczone są w języku polskim.',
    ],
  },
  {
    title: 'Definicje',
    points: [
      {
        text: 'Pojęcia użyte w Regulaminie oznaczają:',
        items: [
          'Usługodawca – podmiot wskazany w § 1 ust. 2.',
          'Serwis – serwis internetowy dostępny pod adresem vocare.pl wraz z jego podstronami.',
          'Użytkownik – osoba fizyczna, która ukończyła 16 lat, osoba prawna albo jednostka organizacyjna nieposiadająca osobowości prawnej, której ustawa przyznaje zdolność prawną, korzystająca z Serwisu.',
          'Konsument – Użytkownik będący osobą fizyczną, dokonujący z Usługodawcą czynności prawnej niezwiązanej bezpośrednio z jego działalnością gospodarczą lub zawodową (art. 22¹ Kodeksu cywilnego).',
          'Przedsiębiorca na prawach konsumenta – osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści umowy wynika, że nie posiada ona dla niej charakteru zawodowego, wynikającego w szczególności z przedmiotu wykonywanej działalności gospodarczej, udostępnionego na podstawie przepisów o CEIDG. Postanowienia Regulaminu dotyczące Konsumentów stosuje się do niej w zakresie wskazanym w art. 38a ustawy o prawach konsumenta oraz art. 385⁵ Kodeksu cywilnego.',
          'Konto – indywidualny panel Użytkownika w Serwisie, dostępny po zalogowaniu.',
          'Usługi – usługi świadczone drogą elektroniczną przez Usługodawcę za pośrednictwem Serwisu, stanowiące usługi cyfrowe w rozumieniu ustawy z dnia 30 maja 2014 r. o prawach konsumenta.',
          'Funkcje AI – Usługi, w których wynik jest generowany z wykorzystaniem modeli sztucznej inteligencji.',
          'Plan Free – nieodpłatny zakres korzystania z Serwisu.',
          'Subskrypcja Premium – odpłatny dostęp do Usług w miesięcznych okresach rozliczeniowych, odnawiany automatycznie.',
          'Tokeny – wewnętrzne jednostki rozliczeniowe Serwisu, wymieniane na wykonanie wybranych Funkcji AI. Tokeny nie są środkiem płatniczym ani pieniądzem elektronicznym.',
          'Pakiet Tokenów – określona liczba Tokenów nabywana jednorazowo za cenę wskazaną w Cenniku.',
          'Tokeny powitalne – nieodpłatne Tokeny przyznawane na zasadach § 9.',
          'Cennik – zestawienie cen Subskrypcji Premium i Pakietów Tokenów oraz zakresu Usług w poszczególnych planach, dostępne pod adresem vocare.pl/pricing.',
          'Treści Użytkownika – dane i treści wprowadzane do Serwisu przez Użytkownika, w szczególności dane profilu, treść CV, treść ogłoszeń o pracę i zapytania kierowane do Funkcji AI.',
          'Umowa – umowa o świadczenie Usług zawarta na odległość na zasadach Regulaminu: umowa o prowadzenie Konta, umowa o Pakiet Tokenów albo umowa o Subskrypcję Premium.',
          'Trwały nośnik – materiał lub narzędzie umożliwiające przechowywanie informacji kierowanych osobiście do Użytkownika w sposób umożliwiający dostęp do nich w przyszłości i ich odtworzenie w niezmienionej postaci, w szczególności wiadomość e-mail.',
        ],
      },
    ],
  },
  {
    title: 'Wymagania techniczne i bezpieczeństwo',
    points: [
      {
        text: 'Do korzystania z Serwisu niezbędne są:',
        items: [
          'urządzenie końcowe z dostępem do sieci Internet,',
          'aktualna wersja przeglądarki internetowej (np. Chrome, Firefox, Safari, Edge) z włączoną obsługą JavaScript i plików cookies,',
          'aktywny adres poczty elektronicznej,',
          'do odczytu pobranych plików CV – oprogramowanie obsługujące format PDF.',
        ],
      },
      'Usługi działają w przeglądarce internetowej i nie wymagają instalowania oprogramowania. Usługodawca nie stosuje technicznych zabezpieczeń ograniczających korzystanie przez Użytkownika z pobranych plików CV.',
      'Korzystanie z usług świadczonych drogą elektroniczną wiąże się z typowymi zagrożeniami, takimi jak złośliwe oprogramowanie, wyłudzanie danych logowania (phishing) czy przejęcie Konta przez osobę nieuprawnioną. W celu ich ograniczenia Usługodawca zaleca korzystanie z aktualnego oprogramowania, stosowanie silnego i unikalnego hasła oraz nieudostępnianie danych logowania. Usługodawca nigdy nie prosi o podanie hasła w wiadomości e-mail.',
      'Usługodawca może czasowo ograniczyć dostęp do Serwisu w celu jego konserwacji, aktualizacji lub usunięcia awarii, dokładając starań, aby przerwy były możliwie krótkie, a o planowanych przerwach informując z wyprzedzeniem.',
    ],
  },
  {
    title: 'Konto',
    points: [
      'Założenie Konta wymaga wypełnienia formularza rejestracyjnego (imię i nazwisko, adres e-mail, hasło) albo skorzystania z logowania przez Google lub LinkedIn oraz akceptacji Regulaminu.',
      'Umowa o prowadzenie Konta zostaje zawarta z chwilą zakończenia rejestracji, na czas nieoznaczony. Prowadzenie Konta jest nieodpłatne.',
      'Konto może założyć osoba, która ukończyła 16 lat. Osoba, która nie ukończyła 18 lat, może zawierać Umowy odpłatne wyłącznie za zgodą przedstawiciela ustawowego.',
      'Użytkownik może posiadać jedno Konto. Użytkownik podaje prawdziwe dane i nie udostępnia Konta osobom trzecim.',
      'Użytkownik odpowiada za zachowanie poufności hasła i powinien niezwłocznie poinformować Usługodawcę o podejrzeniu nieuprawnionego dostępu do Konta.',
    ],
  },
  {
    title: 'Rodzaj i zakres Usług',
    points: [
      {
        text: 'Usługodawca świadczy Usługi wspierające planowanie kariery zawodowej, w szczególności:',
        items: [
          'kreator CV – tworzenie, edycja, przechowywanie i pobieranie CV, w tym w formacie PDF,',
          'ocena jakości CV (Funkcja AI) – ogólna ocena kompletności i jakości CV wraz z rekomendacjami,',
          'dopasowanie CV do oferty pracy (Funkcja AI) – wygenerowanie wersji CV dostosowanej do wskazanego przez Użytkownika ogłoszenia,',
          'generowanie i dopracowanie CV na podstawie danych z profilu (Funkcja AI),',
          'rekomendacje ścieżek kariery wraz z analizą rynku pracy (Funkcje AI),',
          'roadmapy rozwoju kompetencji dla wybranej ścieżki kariery,',
          'prezentację ofert pracy pochodzących z zewnętrznych serwisów, dopasowanych do rekomendacji,',
          'asystenta AI oraz treści informacyjne (blog, raporty o rynku pracy).',
        ],
      },
      'Zakres Usług dostępnych w Planie Free, w ramach Subskrypcji Premium oraz za Tokeny określa Cennik.',
      'Oferty pracy prezentowane w Serwisie pochodzą od podmiotów trzecich. Usługodawca nie jest stroną procesu rekrutacji, nie prowadzi pośrednictwa pracy i nie odpowiada za treść, aktualność ani warunki tych ofert.',
      'Określenie „nielimitowane” użyte w odniesieniu do Subskrypcji Premium oznacza brak limitu liczby skorzystań z danej Usługi w okresie rozliczeniowym przy korzystaniu zgodnym z jej przeznaczeniem. Usługodawca może stosować techniczne ograniczenia częstotliwości zapytań (np. liczby zapytań na minutę), które chronią stabilność Serwisu i nie utrudniają zwykłego korzystania. Zautomatyzowane lub masowe korzystanie podlega § 14.',
      'Usługodawca może rozwijać Serwis i dodawać nowe funkcje. Zmiany Usług odpłatnych, które nie są niezbędne do zachowania ich zgodności z Umową, Usługodawca wprowadza wyłącznie z uzasadnionych przyczyn (rozwój technologii, zmiana dostawców modeli AI, bezpieczeństwo), bez dodatkowych kosztów dla Użytkownika i po uprzednim poinformowaniu go o zmianie. Jeżeli zmiana istotnie i negatywnie wpływa na dostęp do Usługi lub korzystanie z niej, Konsument może wypowiedzieć Umowę w terminie 30 dni od wprowadzenia zmiany lub poinformowania o niej i otrzymać zwrot ceny w części odpowiadającej niewykorzystanemu okresowi Subskrypcji lub niewykorzystanym Tokenom z Pakietu.',
    ],
  },
  {
    title: 'Sztuczna inteligencja',
    points: [
      'Funkcje AI działają z wykorzystaniem modeli sztucznej inteligencji dostarczanych przez podmioty trzecie (w szczególności OpenAI). Korzystając z asystenta AI, Użytkownik komunikuje się z systemem sztucznej inteligencji, a nie z człowiekiem.',
      'Wyniki Funkcji AI, w tym oceny, rekomendacje, analizy rynku i plany rozwoju, mają charakter informacyjny i są generowane automatycznie. Nie stanowią porady prawnej, psychologicznej ani podatkowej, pośrednictwa pracy ani poradnictwa zawodowego w rozumieniu ustawy z dnia 20 marca 2025 r. o rynku pracy i służbach zatrudnienia. Usługodawca nie świadczy usług doradczych, o których mowa w art. 113 ust. 13 ustawy o podatku od towarów i usług.',
      'Modele AI mogą generować informacje błędne, nieaktualne lub niepełne. Dane rynkowe, w tym widełki wynagrodzeń i zapotrzebowanie na stanowiska, są szacunkami. Użytkownik powinien zweryfikować wynik przed jego wykorzystaniem, a przed przesłaniem CV pracodawcy sprawdzić, czy wygenerowana treść odpowiada jego rzeczywistemu doświadczeniu i kwalifikacjom.',
      'Decyzje zawodowe podejmuje Użytkownik. Serwis nie podejmuje wobec Użytkownika decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, które wywoływałyby wobec niego skutki prawne lub w podobny sposób istotnie na niego wpływały.',
      'Treści Użytkownika są przekazywane dostawcom modeli AI w zakresie niezbędnym do wykonania Funkcji AI, na zasadach opisanych w Polityce Prywatności. Usługodawca prosi o niepodawanie w Treściach Użytkownika danych szczególnych kategorii (np. o stanie zdrowia, poglądach, wyznaniu).',
      'Usługodawca nie rości sobie praw do wyników Funkcji AI wygenerowanych na rzecz Użytkownika, który może z nich swobodnie korzystać. Treści wygenerowane przez AI mogą nie podlegać ochronie prawa autorskiego.',
    ],
  },
  {
    title: 'Tokeny',
    points: [
      'Tokeny można uzyskać przez zakup Pakietu Tokenów albo jako Tokeny powitalne (§ 9).',
      {
        text: 'Koszt Funkcji AI w Tokenach wynosi:',
        items: [
          'rekomendacje ścieżek kariery – 60 Tokenów,',
          'analiza rynku pracy – 50 Tokenów,',
          'generowanie CV na podstawie profilu – 20 Tokenów,',
          'dopasowanie CV do oferty pracy – 20 Tokenów,',
          'ocena jakości CV – 10 Tokenów.',
        ],
      },
      'Koszt Usługi w Tokenach jest wyświetlany przed jej uruchomieniem, a jej wykonanie wymaga potwierdzenia przez Użytkownika. Tokeny pobierane są po wykonaniu Usługi. Jeżeli Usługa nie zostanie wykonana z przyczyn leżących po stronie Serwisu, Tokeny nie są pobierane, a Tokeny pobrane omyłkowo Usługodawca zwraca na Konto.',
      'W okresie aktywnej Subskrypcji Premium korzystanie z Usług objętych Subskrypcją nie zmniejsza salda Tokenów.',
      'Tokeny nie wygasają przez cały okres istnienia Konta.',
      'Tokeny nie mają wartości pieniężnej, nie podlegają wymianie na środki pieniężne, przeniesieniu na inne Konto ani odsprzedaży, z zastrzeżeniem zwrotów należnych na podstawie przepisów prawa lub Regulaminu (§ 5 ust. 5, § 11, § 12, § 15 i § 18).',
      'Saldo i historia Tokenów są dostępne na Koncie.',
    ],
  },
  {
    title: 'Subskrypcja Premium',
    points: [
      'Umowa o Subskrypcję Premium jest zawierana na czas nieoznaczony i rozliczana w miesięcznych okresach rozliczeniowych. Subskrypcja odnawia się automatycznie, a opłata za kolejny okres jest pobierana na jego początku z metody płatności wskazanej przy zakupie.',
      'Przed złożeniem zamówienia Użytkownik jest informowany o cenie Subskrypcji i jej automatycznym odnawianiu.',
      'Użytkownik może anulować Subskrypcję w każdej chwili w ustawieniach płatności na Koncie albo wysyłając wiadomość na adres e-mail Usługodawcy. Anulowanie wywołuje skutek z końcem bieżącego okresu rozliczeniowego, do którego Użytkownik zachowuje dostęp do Subskrypcji. Anulowanie nie wyłącza prawa odstąpienia od Umowy (§ 11).',
      'Jeżeli pobranie opłaty za kolejny okres się nie powiedzie, operator płatności ponawia próbę. W razie ostatecznego niepowodzenia Subskrypcja wygasa, a Konto przechodzi na Plan Free.',
      'Po zakończeniu Subskrypcji obowiązują limity Planu Free. CV utworzone wcześniej pozostają zapisane na Koncie i można je przeglądać, edytować i pobierać, jednak utworzenie nowego CV jest możliwe dopiero wtedy, gdy liczba CV na Koncie będzie niższa od limitu Planu Free.',
      'Usługodawca może zmienić cenę Subskrypcji Premium wyłącznie z przyczyn wskazanych w § 18 ust. 1 lit. d, informując Użytkownika na Trwałym nośniku co najmniej 30 dni przed początkiem okresu rozliczeniowego, od którego obowiązuje nowa cena. Użytkownik, który nie akceptuje nowej ceny, może anulować Subskrypcję przed tym terminem bez ponoszenia kosztów.',
    ],
  },
  {
    title: 'Tokeny powitalne',
    points: [
      'Użytkownik, który wyrazi zgodę na otrzymywanie informacji marketingowych drogą elektroniczną (przy rejestracji albo później na Koncie), otrzymuje jednorazowo Tokeny powitalne w liczbie wskazanej w Serwisie w chwili wyrażenia zgody.',
      'Tokeny powitalne przysługują jednorazowo na adres e-mail. Nie przysługują ponownie po wycofaniu i ponownym wyrażeniu zgody ani po usunięciu Konta i założeniu nowego Konta na ten sam adres e-mail.',
      'Wyrażenie zgody marketingowej jest dobrowolne. Jej brak nie uniemożliwia założenia Konta ani korzystania z Serwisu.',
      'Zgodę marketingową można wycofać w każdej chwili. Wycofanie zgody nie powoduje odebrania przyznanych Tokenów powitalnych.',
      'Tokeny powitalne są nieodpłatne i nie podlegają zwrotowi w pieniądzu.',
      'Usługodawca może zakończyć lub zmienić zasady przyznawania Tokenów powitalnych na przyszłość, bez wpływu na Tokeny już przyznane. Tokeny powitalne uzyskane przez zakładanie wielu Kont przez tę samą osobę mogą zostać anulowane.',
    ],
  },
  {
    title: 'Ceny, płatności i zawarcie Umowy odpłatnej',
    points: [
      'Ceny w Cenniku podawane są w złotych polskich i są cenami końcowymi, bez dodatkowych opłat.',
      'W celu zawarcia Umowy odpłatnej Użytkownik wybiera Pakiet Tokenów albo Subskrypcję Premium i zostaje przekierowany do formularza płatności, w którym przed złożeniem zamówienia widzi jego podsumowanie, w tym cenę i – w przypadku Subskrypcji Premium – informację o automatycznym odnawianiu.',
      'Płatności obsługuje Stripe Payments Europe, Limited z siedzibą w Dublinie (Irlandia). Dostępne metody płatności, w szczególności karta płatnicza, BLIK i Apple Pay, są prezentowane w formularzu płatności.',
      'Umowa odpłatna zostaje zawarta z chwilą skutecznego dokonania płatności.',
      'Niezwłocznie po zawarciu Umowy Usługodawca przesyła na adres e-mail Użytkownika potwierdzenie jej zawarcia na Trwałym nośniku, obejmujące w szczególności nazwę Usługi, cenę i informację o prawie odstąpienia, wraz z Regulaminem w formacie PDF zawierającym wzór formularza odstąpienia.',
      'Dostęp do zakupionej Usługi następuje niezwłocznie po zaksięgowaniu płatności, nie później niż w ciągu 24 godzin.',
      'Na żądanie Użytkownika Usługodawca wystawia rachunek.',
      'Informując o obniżce ceny, Usługodawca podaje także najniższą cenę Usługi obowiązującą w okresie 30 dni przed wprowadzeniem obniżki.',
    ],
  },
  {
    title: 'Prawo odstąpienia od Umowy',
    points: [
      'Konsument może odstąpić od Umowy zawartej na odległość bez podania przyczyny w terminie 14 dni od dnia jej zawarcia.',
      'Do zachowania terminu wystarczy wysłanie przed jego upływem oświadczenia o odstąpieniu na adres e-mail kontakt@vocare.pl. Konsument może skorzystać ze wzoru formularza stanowiącego Załącznik nr 1, nie jest to jednak obowiązkowe. Usługodawca niezwłocznie potwierdza otrzymanie oświadczenia wiadomością e-mail.',
      'Odstąpienie od umowy o prowadzenie Konta jest bezpłatne i oznacza usunięcie Konta.',
      'Konsument, który odstąpi od umowy o Pakiet Tokenów albo o Subskrypcję Premium, otrzymuje zwrot całej zapłaconej ceny, niezależnie od tego, w jakim zakresie korzystał z Usługi przed odstąpieniem.',
      'Usługodawca zwraca płatność niezwłocznie, nie później niż w terminie 14 dni od dnia otrzymania oświadczenia o odstąpieniu, przy użyciu takiej samej metody płatności, jakiej użył Konsument, chyba że Konsument zgodzi się na inną metodę niewiążącą się dla niego z kosztami. Z chwilą odstąpienia Tokeny z Pakietu są odejmowane z salda (w liczbie nie większej niż saldo w chwili odstąpienia), a Subskrypcja wygasa.',
      'Prawo odstąpienia od umowy o Subskrypcję Premium przysługuje w terminie 14 dni od jej pierwszego zawarcia. Automatyczne odnowienie Subskrypcji na kolejny okres rozliczeniowy nie stanowi zawarcia nowej Umowy.',
    ],
  },
  {
    title: 'Zgodność Usług z Umową i reklamacje',
    points: [
      'Usługodawca odpowiada wobec Konsumenta za zgodność Usług z Umową przez cały okres ich dostarczania, na zasadach określonych w rozdziale 5b ustawy o prawach konsumenta.',
      'W razie braku zgodności Usługi z Umową Konsument może żądać doprowadzenia jej do zgodności. Jeżeli doprowadzenie do zgodności jest niemożliwe, nie nastąpiło w rozsądnym czasie, brak zgodności występuje nadal albo jest na tyle istotny, że uzasadnia to natychmiastową reakcję, Konsument może złożyć oświadczenie o obniżeniu ceny albo – w przypadku Umowy odpłatnej – o odstąpieniu od Umowy.',
      'Reklamacje można składać na adres e-mail kontakt@vocare.pl. Aby ułatwić jej rozpatrzenie, warto podać adres e-mail przypisany do Konta, opis problemu, datę jego wystąpienia i swoje żądanie. Brak tych informacji nie powoduje pozostawienia reklamacji bez rozpatrzenia.',
      'Usługodawca odpowiada na reklamację Konsumenta w terminie 14 dni od dnia jej otrzymania, na Trwałym nośniku. Jeżeli Usługodawca nie udzieli odpowiedzi w tym terminie, uważa się, że uznał reklamację.',
      'Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w szczególności z pomocy miejskiego lub powiatowego rzecznika konsumentów, organizacji konsumenckich (np. Federacji Konsumentów) albo mediacji prowadzonej przez wojewódzki inspektorat Inspekcji Handlowej. Informacje o tych procedurach są dostępne na stronie uokik.gov.pl. Skorzystanie z nich jest dobrowolne, a o udziale w danym postępowaniu Usługodawca decyduje po otrzymaniu wniosku.',
    ],
  },
  {
    title: 'Treści Użytkownika i zgłaszanie nielegalnych treści',
    points: [
      'Użytkownik zachowuje prawa do Treści Użytkownika. W zakresie niezbędnym do świadczenia Usług (przechowywanie, przetwarzanie, przekazywanie dostawcom modeli AI, generowanie plików) udziela Usługodawcy niewyłącznej, nieodpłatnej licencji na czas przechowywania tych treści w Serwisie.',
      'Użytkownik oświadcza, że jest uprawniony do Treści Użytkownika, a dane osób trzecich (np. osób wskazanych jako referencje w CV) wprowadza wyłącznie wtedy, gdy ma do tego podstawę prawną.',
      'Zakazane jest wprowadzanie do Serwisu treści bezprawnych, w szczególności naruszających prawa osób trzecich, nawołujących do nienawiści, wulgarnych lub zawierających złośliwe oprogramowanie, a także treści mających na celu obejście zabezpieczeń modeli AI.',
      'Usługodawca nie prowadzi ogólnego monitorowania Treści Użytkownika. Każdy może zgłosić treść, którą uważa za nielegalną, wysyłając wiadomość na adres kontakt@vocare.pl. Zgłoszenie powinno zawierać wyjaśnienie, dlaczego treść jest nielegalna, wskazanie jej lokalizacji, imię i nazwisko (lub nazwę) i adres e-mail zgłaszającego oraz oświadczenie o działaniu w dobrej wierze. Usługodawca potwierdza otrzymanie zgłoszenia i rozpatruje je bez zbędnej zwłoki.',
      'Jeżeli Usługodawca usunie Treść Użytkownika, uniemożliwi do niej dostęp albo ograniczy korzystanie z Konta, przekazuje Użytkownikowi uzasadnienie tej decyzji. Użytkownik może się od niej odwołać w terminie 14 dni, wysyłając wiadomość na adres e-mail Usługodawcy. Odwołanie rozpatruje człowiek, bez zbędnej zwłoki.',
      'Punktem kontaktowym Usługodawcy dla organów państw członkowskich UE, Komisji Europejskiej i odbiorców usług, o którym mowa w art. 11 i 12 rozporządzenia (UE) 2022/2065 (akt o usługach cyfrowych), jest adres kontakt@vocare.pl. Komunikacja może odbywać się w języku polskim lub angielskim.',
    ],
  },
  {
    title: 'Zasady korzystania z Serwisu',
    points: [
      {
        text: 'Zakazane jest w szczególności:',
        items: [
          'zautomatyzowane pobieranie danych z Serwisu (scraping, boty) oraz działania nadmiernie obciążające Serwis,',
          'obchodzenie limitów, zabezpieczeń i mechanizmów rozliczeniowych Serwisu,',
          'zakładanie wielu Kont w celu wielokrotnego uzyskania Tokenów powitalnych lub obejścia limitów,',
          'odsprzedaż lub udostępnianie dostępu do Usług osobom trzecim,',
          'wykorzystywanie Funkcji AI do tworzenia treści bezprawnych.',
        ],
      },
      'W razie naruszenia Regulaminu Usługodawca wzywa Użytkownika do zaprzestania naruszeń. W razie rażącego lub uporczywego naruszenia Usługodawca może czasowo zawiesić Konto albo wypowiedzieć umowę o prowadzenie Konta z zachowaniem 14-dniowego terminu wypowiedzenia. Natychmiastowe zablokowanie Konta jest możliwe wyłącznie wtedy, gdy dalsze korzystanie z niego zagraża bezpieczeństwu Serwisu lub innych Użytkowników albo stanowi przestępstwo. Usługodawca przekazuje Użytkownikowi uzasadnienie decyzji (§ 13 ust. 5).',
    ],
  },
  {
    title: 'Rozwiązanie Umowy i usunięcie Konta',
    points: [
      'Użytkownik może w każdej chwili, bez kosztów, wypowiedzieć umowę o prowadzenie Konta, usuwając Konto w ustawieniach Konta (po potwierdzeniu hasłem, jeżeli zostało ustawione) albo wysyłając żądanie usunięcia Konta z adresu e-mail przypisanego do Konta na adres e-mail Usługodawcy. Żądanie przesłane e-mailem Usługodawca realizuje niezwłocznie, nie później niż w terminie 14 dni, i potwierdza to wiadomością e-mail.',
      'Usunięcie Konta jest nieodwracalne. Dane zapisane na Koncie, w tym profil, CV i roadmapy, są usuwane niezwłocznie, z wyjątkiem danych, które Usługodawca jest obowiązany lub uprawniony przechowywać na zasadach Polityki Prywatności.',
      'Przed usunięciem Konta Użytkownik jest informowany o niewykorzystanych Tokenach i aktywnej Subskrypcji Premium. Usunięcie Konta kończy Subskrypcję Premium ze skutkiem natychmiastowym i wstrzymuje dalsze płatności, a niewykorzystane Tokeny wygasają. Usunięcie Konta nie wyłącza prawa do zwrotu należnego na podstawie § 11, § 12 lub § 18 ust. 3 – żądanie zwrotu można przesłać na adres e-mail Usługodawcy także po usunięciu Konta.',
      'Przed usunięciem Konta Użytkownik może pobrać swoje CV.',
      'Usługodawca może wypowiedzieć umowę o prowadzenie Konta w przypadkach określonych w § 14 ust. 2 albo w razie zakończenia działalności Serwisu, w tym drugim przypadku z zachowaniem 30-dniowego terminu wypowiedzenia. W razie zakończenia działalności Serwisu Usługodawca zwraca Użytkownikom część ceny odpowiadającą niewykorzystanemu okresowi Subskrypcji Premium oraz niewykorzystanym Tokenom z Pakietów.',
    ],
  },
  {
    title: 'Odpowiedzialność',
    points: [
      'Usługodawca odpowiada za niewykonanie lub nienależyte wykonanie Umowy na zasadach ogólnych, z zastrzeżeniem postanowień niniejszego paragrafu.',
      'Usługodawca nie odpowiada za decyzje zawodowe Użytkownika podjęte na podstawie wyników Funkcji AI (§ 6), o ile Usługa była zgodna z Umową, za treść ofert pracy pochodzących od podmiotów trzecich ani za skutki udostępnienia przez Użytkownika danych logowania osobom trzecim.',
      'Wobec Użytkowników niebędących Konsumentami ani Przedsiębiorcami na prawach konsumenta odpowiedzialność Usługodawcy jest ograniczona do wysokości opłat uiszczonych przez Użytkownika w okresie 12 miesięcy poprzedzających zdarzenie wywołujące szkodę i nie obejmuje utraconych korzyści. Ograniczenie nie dotyczy szkód wyrządzonych umyślnie.',
      'Żadne postanowienie Regulaminu nie wyłącza ani nie ogranicza uprawnień Konsumenta wynikających z bezwzględnie obowiązujących przepisów prawa.',
    ],
  },
  {
    title: 'Dane osobowe',
    points: [
      'Administratorem danych osobowych Użytkowników jest Usługodawca.',
      'Zasady przetwarzania danych osobowych, w tym prawa Użytkowników, określa Polityka Prywatności dostępna pod adresem vocare.pl/privacy-policy.',
      'Zgoda na otrzymywanie informacji marketingowych jest dobrowolna i odrębna od akceptacji Regulaminu. Można ją wycofać w każdej chwili na Koncie lub wiadomością e-mail.',
    ],
  },
  {
    title: 'Zmiany Regulaminu',
    points: [
      {
        text: 'Usługodawca może zmienić Regulamin wyłącznie z następujących ważnych przyczyn:',
        items: [
          'zmiana przepisów prawa albo wydanie orzeczenia, decyzji lub zalecenia właściwego organu, wpływające na treść Regulaminu,',
          'zmiana sposobu świadczenia Usług wynikająca z rozwoju technologii, zmiany dostawców usług (modeli AI, płatności, hostingu) lub względów bezpieczeństwa,',
          'wprowadzenie nowych Usług albo zmiana zakresu lub wycofanie istniejących,',
          'wzrost kosztów świadczenia Usług ponoszonych przez Usługodawcę (w szczególności opłat dostawców modeli AI, hostingu i operatora płatności) albo zmiana przepisów podatkowych – w zakresie zmiany cen lub kosztu Usług w Tokenach,',
          'zmiana danych Usługodawcy lub formy prowadzenia przez niego działalności,',
          'konieczność usunięcia niejasności, błędów lub omyłek pisarskich.',
        ],
      },
      'O zmianie Regulaminu Usługodawca informuje Użytkowników posiadających Konto na Trwałym nośniku oraz w Serwisie co najmniej 14 dni przed jej wejściem w życie (a w przypadku zmiany ceny Subskrypcji – w terminie z § 8 ust. 6), wskazując treść zmian.',
      'Od dnia wejścia zmian w życie dalsze korzystanie z Konta wymaga zaakceptowania nowej wersji Regulaminu. Do czasu akceptacji dostęp do Usług jest wstrzymany, a Użytkownik może zamiast akceptacji usunąć Konto (§ 15).',
      'Użytkownik, który nie akceptuje zmian, może wypowiedzieć Umowę bez ponoszenia kosztów, w tym przez usunięcie Konta. Konsument, który wypowiada Umowę z powodu niekorzystnej dla niego zmiany, otrzymuje zwrot części ceny odpowiadającej niewykorzystanemu okresowi Subskrypcji Premium oraz niewykorzystanym Tokenom z Pakietów.',
      'Zmiana Regulaminu nie wpływa na cenę zapłaconą za Pakiety Tokenów ani za bieżący okres Subskrypcji Premium.',
    ],
  },
  {
    title: 'Postanowienia końcowe',
    points: [
      'Umowy podlegają prawu polskiemu. Wybór prawa nie pozbawia Konsumenta ochrony przyznanej mu przez bezwzględnie obowiązujące przepisy państwa, w którym ma on miejsce zwykłego pobytu.',
      'Spory z Konsumentami rozstrzyga sąd właściwy według przepisów ogólnych. Spory z Użytkownikami niebędącymi Konsumentami ani Przedsiębiorcami na prawach konsumenta rozstrzyga sąd właściwy dla miejsca zamieszkania Usługodawcy.',
      'Jeżeli którekolwiek postanowienie Regulaminu okaże się nieważne lub bezskuteczne, pozostałe postanowienia pozostają w mocy.',
      'Regulamin obowiązuje od dnia 13.10.2026 w odniesieniu do Umów zawieranych od tego dnia. Wobec Użytkowników, którzy zawarli Umowę przed tym dniem, Regulamin obowiązuje od dnia 28.10.2026 (§ 18 ust. 2) – do dnia poprzedzającego tę datę stosuje się wobec nich poprzednią wersję Regulaminu, obowiązującą od dnia 22.12.2025.',
    ],
  },
];

export const withdrawalFormAnnex20261013 = {
  title: 'Załącznik nr 1 – Wzór formularza odstąpienia od umowy',
  intro: '(formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy)',
  lines: [
    'Adresat: Kacper Jóźwik, e-mail: kontakt@vocare.pl',
    'Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym odstąpieniu od umowy o świadczenie następującej usługi: …',
    'Data zawarcia umowy: …',
    'Imię i nazwisko konsumenta(-ów): …',
    'Adres konsumenta(-ów) / adres e-mail przypisany do Konta: …',
    'Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej): …',
    'Data: …',
  ],
  footnote: '(*) Niepotrzebne skreślić.',
} as const;
