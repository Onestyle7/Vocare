namespace VocareWebAPI.UserManagement.Models.Enums
{
    public enum Risk
    {
        Low = 1, // Niski
        Medium = 2, // Średni
        High = 3, // Wysoki
        Critical = 4, // Krytyczny
        Unknown = 5, // This value is used when the risk level is not specified or cannot be determined
    }
}
