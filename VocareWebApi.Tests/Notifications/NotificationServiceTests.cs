using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Models.Enums;
using VocareWebAPI.Notifications.Repositories.Interfaces;
using VocareWebAPI.Notifications.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.Notifications
{
    /// <summary>Testy jednostkowe <see cref="NotificationService"/>.</summary>
    public sealed class NotificationServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<INotificationRepository> _repository = new(MockBehavior.Strict);
        private readonly NotificationService _sut;

        public NotificationServiceTests()
        {
            _sut = new NotificationService(_repository.Object);
        }

        [Fact]
        public async Task GetUnreadCountAsync_ReturnsRepositoryValue()
        {
            _repository.Setup(r => r.GetUnreadCountAsync(UserId)).ReturnsAsync(4);

            (await _sut.GetUnreadCountAsync(UserId)).Should().Be(4);
        }

        [Fact]
        public async Task GetByUserIdAsync_PassesPagingThrough()
        {
            var page = new List<Notification> { new() { UserId = UserId } };
            _repository.Setup(r => r.GetByUserIdAsync(UserId, 2, 10)).ReturnsAsync(page);

            var result = await _sut.GetByUserIdAsync(UserId, 2, 10);

            result.Should().BeSameAs(page);
        }

        [Fact]
        public async Task MarkAsReadAsync_DelegatesToRepository()
        {
            var id = Guid.NewGuid();
            _repository.Setup(r => r.MarkAsReadAsync(id, UserId)).Returns(Task.CompletedTask);

            await _sut.MarkAsReadAsync(id, UserId);

            _repository.Verify(r => r.MarkAsReadAsync(id, UserId), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_BuildsUnreadNotificationWithProvidedData()
        {
            var relatedId = Guid.NewGuid();
            Notification? captured = null;
            _repository
                .Setup(r => r.CreateAsync(It.IsAny<Notification>()))
                .Callback<Notification>(n => captured = n)
                .Returns(Task.CompletedTask);

            await _sut.CreateAsync(
                UserId,
                "Roadmap ready",
                "Your roadmap is available",
                NotificationType.RoadmapGenerationCompleted,
                relatedId
            );

            captured.Should().NotBeNull();
            captured!.UserId.Should().Be(UserId);
            captured.Title.Should().Be("Roadmap ready");
            captured.Type.Should().Be(NotificationType.RoadmapGenerationCompleted);
            captured.RelatedEntityId.Should().Be(relatedId);
            captured.IsRead.Should().BeFalse();
            captured.ReadAt.Should().BeNull();
            captured.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }
    }
}
