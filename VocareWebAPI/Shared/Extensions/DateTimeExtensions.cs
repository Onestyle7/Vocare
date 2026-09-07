namespace VocareWebAPI.Shared.Extensions
{
    public static class DateTimeExtensions
    {
        public static DateTime TruncateToMicroseconds(this DateTime dt)
        {
            return dt.AddTicks(-(dt.Ticks % (TimeSpan.TicksPerMillisecond / 1000)));
        }
    }
}
