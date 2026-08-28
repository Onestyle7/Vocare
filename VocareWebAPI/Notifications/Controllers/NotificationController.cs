using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Notifications.Services.Interfaces;

namespace VocareWebAPI.Notifications.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var unreadCount = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { unreadCount });
        }

        [Authorize]
        [HttpGet("user-notifications")]
        public async Task<IActionResult> GetUserNotifications(
            [FromQuery] [Range(1, 100)] int page = 1,
            [FromQuery] [Range(1, 100)] int pageSize = 20
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var notifications = await _notificationService.GetByUserIdAsync(userId, page, pageSize);
            return Ok(notifications);
        }

        [Authorize]
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            await _notificationService.MarkAsReadAsync(id, userId);
            return NoContent();
        }
    }
}
