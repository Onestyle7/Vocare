using VocareWebAPI.Billing.Models.Dtos;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IPurchaseConfirmationService
    {
        Task SendPurchaseConfirmationAsync(PurchaseConfirmationDto confirmation);
    }
}
