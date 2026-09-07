using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Notifications.Exceptions
{
    public class NotificationNotFoundException : NotFoundException
    {
        public Guid NotificationId { get; set; }

        public NotificationNotFoundException(Guid notificationId)
            : base($"Notification with ID {notificationId} not found", "NOTIFICATION_NOT_FOUND")
        {
            NotificationId = notificationId;
        }
    }
}
