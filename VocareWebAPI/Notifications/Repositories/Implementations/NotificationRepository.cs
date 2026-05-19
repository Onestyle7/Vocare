using System.Data;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Repositories.Interfaces;

namespace VocareWebAPI.Notifications.Repositories.Implementations
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Notification>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize
        )
        {
            var result = await _context
                .Notifications.Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return result;
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            var unreadNotification = await _context.Notifications.CountAsync(x =>
                x.UserId == userId && x.IsRead == false
            );

            return unreadNotification;
        }

        public async Task MarkAsReadAsync(Guid notificationId, string userId)
        {
            var notification = await _context.Notifications.FirstOrDefaultAsync(n =>
                n.Id == notificationId && n.UserId == userId
            );

            if (notification == null)
                throw new InvalidOperationException("Notification not found");

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }
}
