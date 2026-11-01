using System;
using FluentAssertions;
using VocareWebAPI.Billing.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    /// <summary>
    /// Testy <see cref="WithdrawalPeriodCalculator"/> – koniec 14-dniowego terminu na odstąpienie
    /// liczony według art. 111 § 2 i art. 115 KC w czasie polskim.
    /// </summary>
    public sealed class WithdrawalPeriodCalculatorTests
    {
        private static DateTime Utc(int y, int mo, int d, int h = 0, int mi = 0) =>
            new(y, mo, d, h, mi, 0, DateTimeKind.Utc);

        [Fact]
        public void GetDeadlineUtc_OnRegularWeekday_EndsAtMidnightAfterFourteenthDay()
        {
            // Zawarcie: śr. 7.10.2026 12:00 (CEST); 14. dzień: śr. 21.10; koniec: 22.10 00:00 CEST
            var deadline = WithdrawalPeriodCalculator.GetDeadlineUtc(Utc(2026, 10, 7, 10));

            deadline.Should().Be(Utc(2026, 10, 21, 22));
        }

        [Fact]
        public void GetDeadlineUtc_IsLaterThanSameHourFourteenDaysLater()
        {
            // Trial Stripe kończy się o godzinie startu – termin na odstąpienie trwa dłużej
            var concluded = Utc(2026, 10, 7, 13);

            WithdrawalPeriodCalculator
                .GetDeadlineUtc(concluded)
                .Should()
                .BeAfter(concluded.AddDays(14));
        }

        [Fact]
        public void GetDeadlineUtc_WhenLastDayIsSaturday_MovesToMondayAcrossDstChange()
        {
            // 14. dzień: sob. 24.10.2026 → pon. 26.10; 25.10 zmiana czasu na CET (UTC+1)
            var deadline = WithdrawalPeriodCalculator.GetDeadlineUtc(Utc(2026, 10, 10, 10));

            deadline.Should().Be(Utc(2026, 10, 26, 23));
        }

        [Fact]
        public void GetDeadlineUtc_WhenLastDayIsPublicHoliday_MovesToNextWorkingDay()
        {
            // 14. dzień: śr. 11.11.2026 (Święto Niepodległości) → czw. 12.11
            var deadline = WithdrawalPeriodCalculator.GetDeadlineUtc(Utc(2026, 10, 28, 10));

            deadline.Should().Be(Utc(2026, 11, 12, 23));
        }

        [Fact]
        public void GetDeadlineUtc_WhenLastDayIsEasterMonday_MovesToTuesday()
        {
            // Wielkanoc 2027: 28.03; 14. dzień: pon. 29.03 (Poniedziałek Wielkanocny) → wt. 30.03
            var deadline = WithdrawalPeriodCalculator.GetDeadlineUtc(Utc(2027, 3, 15, 10));

            deadline.Should().Be(Utc(2027, 3, 30, 22));
        }

        [Fact]
        public void GetDeadlineUtc_UsesPolishDateOfConclusion()
        {
            // 7.10 22:30 UTC to już 8.10 00:30 w Polsce – dniem zawarcia jest 8.10
            var deadline = WithdrawalPeriodCalculator.GetDeadlineUtc(Utc(2026, 10, 7, 22, 30));

            deadline.Should().Be(Utc(2026, 10, 22, 22));
        }

        [Theory]
        [InlineData(2026, 4, 5)]
        [InlineData(2027, 3, 28)]
        [InlineData(2028, 4, 16)]
        public void GetEasterSunday_ReturnsKnownDates(int year, int month, int day)
        {
            WithdrawalPeriodCalculator
                .GetEasterSunday(year)
                .Should()
                .Be(new DateTime(year, month, day));
        }

        [Theory]
        [InlineData(2026, 6, 4, true)] // Boże Ciało 2026
        [InlineData(2026, 5, 24, true)] // Zielone Świątki 2026
        [InlineData(2026, 12, 24, true)] // Wigilia (od 2025)
        [InlineData(2024, 12, 24, false)]
        [InlineData(2026, 10, 21, false)]
        public void IsPolishPublicHoliday_RecognisesMovableAndNewHolidays(
            int year,
            int month,
            int day,
            bool expected
        )
        {
            WithdrawalPeriodCalculator
                .IsPolishPublicHoliday(new DateTime(year, month, day))
                .Should()
                .Be(expected);
        }
    }
}
