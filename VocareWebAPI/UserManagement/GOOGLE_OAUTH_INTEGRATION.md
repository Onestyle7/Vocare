# Google OAuth Integration with Bearer Tokens - Implementation Guide

## Overview

Successfully integrated Google OAuth authentication to work with ASP.NET Core Identity Bearer tokens. This implementation allows users to authenticate via Google and receive bearer tokens for API access, just like regular email/password login.

## Architecture

### 1. Authentication Schemes Configuration (Program.cs)

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = IdentityConstants.BearerScheme;
    options.DefaultChallengeScheme = IdentityConstants.BearerScheme;
    options.DefaultScheme = IdentityConstants.BearerScheme;
})
.AddBearerToken(IdentityConstants.BearerScheme)
.AddGoogle(options => {
    options.ClientId = googleClientId;
    options.ClientSecret = googleClientSecret;
    // Google must redirect back to this exact path
    options.CallbackPath = "/api/auth/google-callback";
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
});
```

### 2. Identity API Endpoints

```csharp
// Enable automatic Identity endpoints: /login, /refresh, /logout
app.MapIdentityApi<User>();
```

This provides standard endpoints:

- `POST /login` - Email/password authentication returning bearer tokens
- `POST /refresh` - Token refresh
- `POST /logout` - Token invalidation

## Google OAuth Flow

### Step 1: Initiate Google Login

**Endpoint:** `GET /auth/google-signin`

- Redirects to Google OAuth consent screen
- Configured with required scopes (openid, profile, email)

### Step 2: Handle Google Callback

**Endpoint:** `GET /auth/google-callback`

- Processes Google OAuth response
- Creates user account if doesn't exist
- Sets up billing for new users
- Associates Google login with user account
- Redirects to frontend with userId parameter

**Frontend redirect format:**

```
{frontendUrl}?googleLogin=success&userId={user.Id}
```

### Step 3: Generate Bearer Token

**Endpoint:** `POST /auth/google-get-token`

**Request:**

```json
{
  "userId": "user-id-from-callback"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "userId": "user-id",
  "email": "user@example.com"
}
```

**Key Implementation:**

```csharp
// Verify user has Google login
var logins = await _userManager.GetLoginsAsync(user);
if (!logins.Any(x => x.LoginProvider == "Google")) {
    return BadRequest(new { message = "User not authenticated with Google" });
}

// Generate bearer token using SignInManager
_signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;
await _signInManager.SignInAsync(user, isPersistent: false);
```

## Frontend Integration

### 1. Google Login Button

```javascript
// Redirect to Google OAuth
window.location.href = "/auth/google-signin";
```

### 2. Handle OAuth Callback

```javascript
// Extract userId from URL parameters after redirect
const urlParams = new URLSearchParams(
  window.location.search
);
const googleLogin = urlParams.get("googleLogin");
const userId = urlParams.get("userId");

if (googleLogin === "success" && userId) {
  // Step 3: Get bearer token
  const response = await fetch("/auth/google-get-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (response.ok) {
    // Extract bearer token from Authorization header or response
    const authHeader =
      response.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Store token for API calls
    localStorage.setItem("bearer_token", token);
  }
}
```

### 3. Use Bearer Token for API Calls

```javascript
const token = localStorage.getItem("bearer_token");

fetch("/api/protected-endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Key Benefits

1. **Unified Authentication**: Both Google OAuth and email/password use the same bearer token system
2. **Standard Identity Integration**: Leverages ASP.NET Core Identity's built-in bearer token support
3. **Automatic Token Management**: Uses Identity's built-in token generation and validation
4. **Consistent API Access**: All users (Google or email/password) use the same bearer tokens
5. **No JWT Complexity**: Uses Identity's optimized bearer token implementation

## Security Features

- Email verification automatic for Google users
- External login association tracked in Identity
- Bearer tokens follow Identity security patterns
- Automatic token expiration and refresh support
- Protection against token misuse

## Testing

1. **Start Application**: `dotnet run --project VocareWebAPI/VocareWebAPI.csproj`
2. **Test Google Login**: Navigate to `/auth/google-signin`
3. **Verify Token Generation**: Use `/auth/google-get-token` with valid userId
4. **Test API Access**: Use generated bearer token with protected endpoints

## Error Handling

- Invalid userId: Returns "User not found"
- Non-Google users: Returns "User not authenticated with Google"
- Database errors: Logged and handled gracefully
- OAuth failures: Redirect to frontend with error parameters

## Future Enhancements

1. **Direct Token Response**: Modify callback to return tokens directly without extra step
2. **Refresh Token Support**: Implement token refresh for Google OAuth users
3. **Mobile Deep Links**: Support mobile app OAuth flows
4. **Token Scoping**: Implement role-based token scopes

## Dependencies

- **ASP.NET Core Identity 9.0**: Bearer token authentication
- **Microsoft.AspNetCore.Authentication.Google**: Google OAuth integration
- **Entity Framework Core**: User data persistence
- **Custom UserRegistrationHandler**: Billing setup for new users

This implementation provides a clean, secure, and maintainable approach to Google OAuth integration that seamlessly works with existing bearer token authentication patterns.
