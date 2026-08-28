using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Models.Enums;

namespace VocareWebAPI.Notifications.Services.Interfaces
{
    public interface INotificationService
    {
        Task<int> GetUnreadCountAsync(string userId);
        Task<List<Notification>> GetByUserIdAsync(string userId, int page, int pageSize);
        Task MarkAsReadAsync(Guid notificationId, string userId);
        Task CreateAsync(
            string userId,
            string title,
            string message,
            NotificationType type,
            Guid? relatedEntityId
        );
    }
}
