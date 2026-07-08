using System.ComponentModel.DataAnnotations;
using VocareWebAPI.Notifications.Exceptions;
using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Models.Enums;
using VocareWebAPI.Notifications.Repositories.Interfaces;
using VocareWebAPI.Notifications.Services.Interfaces;

namespace VocareWebAPI.Notifications.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            var unreadCount = await _notificationRepository.GetUnreadCountAsync(userId);
            return unreadCount;
        }

        public async Task<List<Notification>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize
        )
        {
            var notifications = await _notificationRepository.GetByUserIdAsync(
                userId,
                page,
                pageSize
            );

            return notifications;
        }

        public async Task MarkAsReadAsync(Guid notificationId, string userId)
        {
            await _notificationRepository.MarkAsReadAsync(notificationId, userId);
        }

        public async Task CreateAsync(
            string userId,
            string title,
            string message,
            NotificationType type,
            Guid? relatedEntityId
        )
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityId = relatedEntityId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            };

            await _notificationRepository.CreateAsync(notification);
        }
    }
}
