using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.Notifications.Controllers;
using VocareWebAPI.Notifications.Models.Entities;
using VocareWebAPI.Notifications.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Notifications
{
    /// <summary>Testy jednostkowe <see cref="NotificationController"/>.</summary>
    public sealed class NotificationControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<INotificationService> _service = new(MockBehavior.Strict);
        private readonly NotificationController _sut;

        public NotificationControllerTests()
        {
            _sut = new NotificationController(_service.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetUnreadCount_ReturnsCountPayload()
        {
            _service.Setup(s => s.GetUnreadCountAsync(UserId)).ReturnsAsync(7);

            var result = await _sut.GetUnreadCount();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("unreadCount")
                .Should()
                .Be(7);
        }

        [Fact]
        public async Task GetUnreadCount_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetUnreadCount();

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetUserNotifications_ForwardsPagingAndReturnsList()
        {
            var list = new List<Notification> { new() { UserId = UserId } };
            _service.Setup(s => s.GetByUserIdAsync(UserId, 3, 15)).ReturnsAsync(list);

            var result = await _sut.GetUserNotifications(page: 3, pageSize: 15);

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(list);
        }

        [Fact]
        public async Task MarkAsRead_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _service.Setup(s => s.MarkAsReadAsync(id, UserId)).Returns(Task.CompletedTask);

            var result = await _sut.MarkAsRead(id);

            result.Should().BeOfType<NoContentResult>();
            _service.Verify(s => s.MarkAsReadAsync(id, UserId), Times.Once);
        }

        [Fact]
        public async Task MarkAsRead_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.MarkAsRead(Guid.NewGuid());

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }
    }
}
