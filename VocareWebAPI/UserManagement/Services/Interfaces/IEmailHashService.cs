namespace VocareWebAPI.UserManagement.Services.Interfaces;

public interface IEmailHashService
{
    string ComputeHash(string email);
}
