using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Controllers;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Results;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Controllers;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Controllers
{
    /// <summary>Testy jednostkowe <see cref="AuthController"/>.</summary>
    public sealed class AuthControllerTests
    {
        private readonly Mock<IAuthenticationServiceOwn> _auth = new(MockBehavior.Strict);
        private readonly AuthController _sut;

        public AuthControllerTests()
        {
            _sut = new AuthController(_auth.Object);
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            };
        }

        [Fact]
        public async Task Login_WhenServiceSucceeds_ReturnsOkWithAccessToken()
        {
            _auth
                .Setup(a => a.LoginAsync("ada@example.com", "pw"))
                .ReturnsAsync(
                    Result<LoginResult>.Ok(
                        LoginResult.Successful("token-abc", "user-1", "ada@example.com")
                    )
                );

            var result = await _sut.Login(
                new LoginRequest { Email = "ada@example.com", Password = "pw" }
            );

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("accessToken")
                .Should()
                .Be("token-abc");
        }

        [Fact]
        public async Task Login_WhenServiceFails_ReturnsMappedErrorStatus()
        {
            _auth
                .Setup(a => a.LoginAsync("ada@example.com", "pw"))
                .ReturnsAsync(
                    Result<LoginResult>.Fail(new Error("INVALID_CREDENTIALS", "bad", 401))
                );

            var result = await _sut.Login(
                new LoginRequest { Email = "ada@example.com", Password = "pw" }
            );

            result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(401);
        }

        [Fact]
        public async Task Refresh_WhenNotImplemented_ReturnsMappedError()
        {
            _auth
                .Setup(a => a.RefreshAsync("rt"))
                .ReturnsAsync(Result<RefreshResult>.Fail(new Error("NOT_IMPLEMENTED", "no", 422)));

            var result = await _sut.Refresh(new RefreshRequest { RefreshToken = "rt" });

            result.Result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(422);
        }
    }

    /// <summary>Testy jednostkowe <see cref="DashboardController"/>.</summary>
    public sealed class DashboardControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IDashboardService> _service = new(MockBehavior.Strict);
        private readonly DashboardController _sut;

        public DashboardControllerTests()
        {
            _sut = new DashboardController(_service.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetDashboardSummary_ReturnsServiceResult()
        {
            var summary = new DashboardSummaryDto { RecommendationsCount = 3 };
            _service.Setup(s => s.GetDashboardSummaryAsync(UserId)).ReturnsAsync(summary);

            var result = await _sut.GetDashboardSummary();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(summary);
        }

        [Fact]
        public async Task GetDashboardSummary_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetDashboardSummary();

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetProfileAttributes_ReturnsServiceResult()
        {
            var attributes = new ProfileAttributesDto { Creativity = 55 };
            _service.Setup(s => s.GetProfileAttributesAsync(UserId)).ReturnsAsync(attributes);

            var result = await _sut.GetProfileAttributes();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(attributes);
        }
    }

    /// <summary>Testy jednostkowe <see cref="MarketingController"/>.</summary>
    public sealed class MarketingControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IMarketingConsentRepository> _repository = new(MockBehavior.Strict);
        private readonly Mock<IUserSetupService> _userSetup = new(MockBehavior.Strict);
        private readonly MarketingController _sut;

        public MarketingControllerTests()
        {
            _sut = new MarketingController(
                _repository.Object,
                NullLogger<MarketingController>.Instance,
                _userSetup.Object
            );
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetMarketingConsent_WithoutUser_ReturnsUnauthorized()
        {
            _sut.WithoutUser();

            var result = await _sut.GetMarketingConsent();

            result.Should().BeOfType<UnauthorizedResult>();
        }

        [Fact]
        public async Task GetMarketingConsent_ReturnsConsentStatus()
        {
            _repository
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(new MarketingConsent { UserId = UserId, IsConsentGiven = true });

            var result = await _sut.GetMarketingConsent();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("hasConsent")
                .Should()
                .Be(true);
        }

        [Fact]
        public async Task GiveMarketingConsent_WhenNoExistingConsent_CreatesConsentAndGrantsWelcomeTokens()
        {
            _repository
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync((MarketingConsent?)null);
            _repository
                .Setup(r => r.CreateAsync(It.IsAny<MarketingConsent>()))
                .Returns(Task.CompletedTask);
            _userSetup.Setup(s => s.GrantWelcomeTokensAsync(UserId)).ReturnsAsync(120);

            var result = await _sut.GiveMarketingConsent();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("welcomeTokensGranted")
                .Should()
                .Be(120);
            _repository.Verify(
                r => r.CreateAsync(It.Is<MarketingConsent>(c => c.IsConsentGiven)),
                Times.Once
            );
        }

        [Fact]
        public async Task GiveMarketingConsent_WhenRestoringWithdrawnConsent_ReturnsGrantResult()
        {
            var consent = new MarketingConsent { UserId = UserId, IsConsentGiven = false };
            _repository.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(consent);
            _repository.Setup(r => r.UpdateAsync(consent)).Returns(Task.CompletedTask);
            _userSetup.Setup(s => s.GrantWelcomeTokensAsync(UserId)).ReturnsAsync(0);

            var result = await _sut.GiveMarketingConsent();

            consent.IsConsentGiven.Should().BeTrue();
            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("welcomeTokensGranted")
                .Should()
                .Be(0);
            _userSetup.Verify(s => s.GrantWelcomeTokensAsync(UserId), Times.Once);
        }

        [Fact]
        public async Task GiveMarketingConsent_WhenGrantFails_StillReturnsOkWithZeroTokens()
        {
            _repository
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync((MarketingConsent?)null);
            _repository
                .Setup(r => r.CreateAsync(It.IsAny<MarketingConsent>()))
                .Returns(Task.CompletedTask);
            _userSetup
                .Setup(s => s.GrantWelcomeTokensAsync(UserId))
                .ThrowsAsync(new InvalidOperationException("db down"));

            var result = await _sut.GiveMarketingConsent();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("welcomeTokensGranted")
                .Should()
                .Be(0);
        }

        [Fact]
        public async Task GiveMarketingConsent_WhenAlreadyActive_ThrowsWithoutGrantingTokens()
        {
            _repository
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(new MarketingConsent { UserId = UserId, IsConsentGiven = true });

            await _sut.Invoking(c => c.GiveMarketingConsent())
                .Should()
                .ThrowAsync<MarketingConsentAlreadyActiveException>();
            _userSetup.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task WithdrawMarketingConsent_WhenNotActive_Throws()
        {
            _repository
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(new MarketingConsent { UserId = UserId, IsConsentGiven = false });

            await _sut.Invoking(c => c.WithdrawMarketingConsent())
                .Should()
                .ThrowAsync<MarketingConsentNotActiveException>();
        }

        [Fact]
        public async Task WithdrawMarketingConsent_WhenActive_MarksWithdrawn()
        {
            var consent = new MarketingConsent { UserId = UserId, IsConsentGiven = true };
            _repository.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(consent);
            _repository.Setup(r => r.UpdateAsync(consent)).Returns(Task.CompletedTask);

            var result = await _sut.WithdrawMarketingConsent();

            result.Should().BeOfType<OkObjectResult>();
            consent.IsConsentGiven.Should().BeFalse();
            consent.ConsentWithdrawnDate.Should().NotBeNull();
        }
    }

    /// <summary>Testy jednostkowe <see cref="UserProfileController"/> (realny <c>UserProfileService</c> na InMemory).</summary>
    public sealed class UserProfileControllerTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly Mock<IUserProfileRepository> _repository = new();
        private readonly Mock<VocareWebAPI.CareerAdvisor.Services.Interfaces.ICvParserService> _cvParser =
            new();
        private readonly UserProfileController _sut;

        public UserProfileControllerTests()
        {
            _context = TestDbContextFactory.CreateContext();
            var service = new UserProfileService(
                _context,
                MapperFactory.Create(typeof(UserProfileMappingProfile)),
                NullLogger<UserProfileService>.Instance,
                _repository.Object
            );
            _sut = new UserProfileController(
                service,
                NullLogger<UserProfileController>.Instance,
                _cvParser.Object
            );
            _sut.WithUser(UserId);
        }

        public void Dispose() => _context.Dispose();

        [Fact]
        public async Task GetCurrentUserProfile_ReturnsMappedProfile()
        {
            _repository
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(new UserProfile { UserId = UserId, FirstName = "Ada" });

            var result = await _sut.GetCurrentUserProfile();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeOfType<UserProfileDto>()
                .Which.FirstName.Should()
                .Be("Ada");
        }

        [Fact]
        public async Task DeleteCurrentUserProfile_WhenMissing_PropagatesNotFound()
        {
            await _sut.Invoking(c => c.DeleteCurrentUserProfile())
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task ImportCv_WithNoFile_ReturnsBadRequest()
        {
            var result = await _sut.ImportCv(null!);

            result.Should().BeOfType<BadRequestObjectResult>();
            _cvParser.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task ImportCv_WithFile_DelegatesToParser()
        {
            var file = new Mock<IFormFile>();
            file.Setup(f => f.Length).Returns(2048);
            var dto = new UserProfileDto { FirstName = "Parsed" };
            _cvParser.Setup(p => p.ParseAndSaveAsync(file.Object, UserId)).ReturnsAsync(dto);

            var result = await _sut.ImportCv(file.Object);

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(dto);
        }
    }
}
