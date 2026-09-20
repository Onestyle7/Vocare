using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Notifications.Exceptions;
using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Models.Enums;
using VocareWebAPI.Notifications.Repositories.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Notifications
{
    /// <summary>Testy jednostkowe <see cref="NotificationRepository"/> (dostawca InMemory).</summary>
    public sealed class NotificationRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly NotificationRepository _sut;

        public NotificationRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new NotificationRepository(_context);
        }

        public void Dispose() => _context.Dispose();

        private async Task<Notification> SeedAsync(
            string userId = UserId,
            bool isRead = false,
            DateTime? createdAt = null
        )
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "t",
                Message = "m",
                Type = NotificationType.RoadmapGenerationCompleted,
                IsRead = isRead,
                CreatedAt = createdAt ?? DateTime.UtcNow,
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return notification;
        }

        [Fact]
        public async Task GetUnreadCountAsync_CountsOnlyUnreadForUser()
        {
            await SeedAsync(isRead: false);
            await SeedAsync(isRead: false);
            await SeedAsync(isRead: true);
            await SeedAsync(userId: "other", isRead: false);

            (await _sut.GetUnreadCountAsync(UserId)).Should().Be(2);
        }

        [Fact]
        public async Task GetByUserIdAsync_ReturnsNewestFirstAndPages()
        {
            await SeedAsync(createdAt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
            await SeedAsync(createdAt: new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc));
            await SeedAsync(createdAt: new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));

            var firstPage = await _sut.GetByUserIdAsync(UserId, page: 1, pageSize: 2);
            var secondPage = await _sut.GetByUserIdAsync(UserId, page: 2, pageSize: 2);

            firstPage.Should().HaveCount(2);
            firstPage[0].CreatedAt.Should().Be(new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));
            secondPage.Should().ContainSingle();
        }

        [Fact]
        public async Task MarkAsReadAsync_SetsReadFlagAndTimestamp()
        {
            var notification = await SeedAsync(isRead: false);

            await _sut.MarkAsReadAsync(notification.Id, UserId);

            _context.ChangeTracker.Clear();
            var reloaded = await _context.Notifications.SingleAsync();
            reloaded.IsRead.Should().BeTrue();
            reloaded.ReadAt.Should().NotBeNull();
        }

        [Fact]
        public async Task MarkAsReadAsync_WhenNotificationBelongsToAnotherUser_Throws()
        {
            var notification = await SeedAsync(userId: "other");

            await _sut.Invoking(r => r.MarkAsReadAsync(notification.Id, UserId))
                .Should()
                .ThrowAsync<NotificationNotFoundException>();
        }

        [Fact]
        public async Task MarkAsReadAsync_WhenMissing_Throws()
        {
            await _sut.Invoking(r => r.MarkAsReadAsync(Guid.NewGuid(), UserId))
                .Should()
                .ThrowAsync<NotificationNotFoundException>();
        }
    }
}
