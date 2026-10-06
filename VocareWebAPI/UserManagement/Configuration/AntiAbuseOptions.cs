namespace VocareWebAPI.UserManagement.Configuration;

public class AntiAbuseOptions
{
    public const string SectionName = "AntiAbuse";
    public string EmailHashKey { get; set; } = string.Empty;
}
