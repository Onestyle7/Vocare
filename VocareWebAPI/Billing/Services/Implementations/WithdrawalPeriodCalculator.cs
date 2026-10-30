namespace VocareWebAPI.Billing.Services.Implementations
{
    /// <summary>
    /// Koniec terminu na odstąpienie od umowy zawartej na odległość (art. 27 UoPK), liczony
    /// według Kodeksu cywilnego w czasie polskim:
    /// - art. 111 § 2 KC – dnia zawarcia umowy nie wlicza się, termin kończy się z upływem
    ///   ostatniego dnia (o północy),
    /// - art. 115 KC – koniec terminu przypadający na sobotę lub dzień ustawowo wolny od pracy
    ///   przesuwa się na następny dzień roboczy.
    /// </summary>
    public static class WithdrawalPeriodCalculator
    {
        public const int WithdrawalPeriodDays = 14;

        // Gdy strefa czasowa jest niedostępna, przyjmujemy UTC+2 (czas letni) – termin wychodzi
        // wtedy najwyżej godzinę później niż faktyczny, nigdy wcześniej
        private static readonly TimeSpan FallbackPolishOffset = TimeSpan.FromHours(2);

        /// <summary>
        /// Pierwsza chwila (UTC) po upływie terminu na odstąpienie od umowy zawartej
        /// w <paramref name="concludedAtUtc"/>.
        /// </summary>
        public static DateTime GetDeadlineUtc(DateTime concludedAtUtc)
        {
            var concludedUtc = DateTime.SpecifyKind(concludedAtUtc, DateTimeKind.Utc);
            var warsaw = FindWarsawTimeZone();

            var concludedLocalDate = warsaw is null
                ? (concludedUtc + FallbackPolishOffset).Date
                : TimeZoneInfo.ConvertTimeFromUtc(concludedUtc, warsaw).Date;

            var lastDay = concludedLocalDate.AddDays(WithdrawalPeriodDays);
            while (!IsWorkingDay(lastDay))
                lastDay = lastDay.AddDays(1);

            // Północ po ostatnim dniu terminu, w czasie polskim
            var endLocal = DateTime.SpecifyKind(lastDay.AddDays(1), DateTimeKind.Unspecified);
            return warsaw is null
                ? DateTime.SpecifyKind(endLocal - FallbackPolishOffset, DateTimeKind.Utc)
                : TimeZoneInfo.ConvertTimeToUtc(endLocal, warsaw);
        }

        /// <summary>Dzień roboczy w rozumieniu art. 115 KC: nie sobota i nie dzień wolny od pracy.</summary>
        public static bool IsWorkingDay(DateTime date) =>
            date.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday)
            && !IsPolishPublicHoliday(date);

        /// <summary>Dni ustawowo wolne od pracy (ustawa z 18 stycznia 1951 r.).</summary>
        public static bool IsPolishPublicHoliday(DateTime date)
        {
            var day = date.Date;
            var (month, dayOfMonth) = (day.Month, day.Day);

            if (
                (month, dayOfMonth)
                is
                    (1, 1)
                    or
                    (1, 6)
                    or
                    (5, 1)
                    or
                    (5, 3)
                    or
                    (8, 15)
                    or
                    (11, 1)
                    or
                    (11, 11)
                    or
                    (12, 25)
                    or
                    (12, 26)
            )
                return true;

            // Wigilia jest dniem wolnym od pracy od 2025 r.
            if (month == 12 && dayOfMonth == 24 && day.Year >= 2025)
                return true;

            var easter = GetEasterSunday(day.Year);
            return day == easter
                || day == easter.AddDays(1) // Poniedziałek Wielkanocny
                || day == easter.AddDays(49) // Zielone Świątki
                || day == easter.AddDays(60); // Boże Ciało
        }

        /// <summary>Niedziela Wielkanocna (algorytm Meeusa/Jonesa/Butchera, kalendarz gregoriański).</summary>
        public static DateTime GetEasterSunday(int year)
        {
            var a = year % 19;
            var b = year / 100;
            var c = year % 100;
            var d = b / 4;
            var e = b % 4;
            var f = (b + 8) / 25;
            var g = (b - f + 1) / 3;
            var h = (19 * a + b - d - g + 15) % 30;
            var i = c / 4;
            var k = c % 4;
            var l = (32 + 2 * e + 2 * i - h - k) % 7;
            var m = (a + 11 * h + 22 * l) / 451;
            var month = (h + l - 7 * m + 114) / 31;
            var dayOfMonth = (h + l - 7 * m + 114) % 31 + 1;
            return new DateTime(year, month, dayOfMonth);
        }

        private static TimeZoneInfo? FindWarsawTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
            }
            catch (TimeZoneNotFoundException)
            {
                return null;
            }
        }
    }
}
