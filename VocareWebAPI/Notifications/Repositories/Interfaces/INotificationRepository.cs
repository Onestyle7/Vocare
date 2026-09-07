using VocareWebAPI.Notifications.Models.Entities;

namespace VocareWebAPI.Notifications.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<int> GetUnreadCountAsync(string userId);
        Task<List<Notification>> GetByUserIdAsync(string userId, int page, int pageSize);
        Task MarkAsReadAsync(Guid notificationId, string userId);
        Task CreateAsync(Notification notification);
    }
}
