# Vocare Mobile

Flutter app for iOS and Android. It talks to the same .NET backend as the web app and follows its contracts: the same endpoints, error codes, Polish copy and password rules.

**Scope so far:** onboarding, sign in / sign up / password reset, Google and LinkedIn login, the GDPR consent wall, the dashboard (same data as the web dashboard), profile editing with CV import, notifications, and four AI features:
- **Assistant:** career recommendations, plus path details with SWOT and matched job offers.
- **Market analysis:** salary progression, work attributes, entry difficulty, AI narrator, trends and skill demand.
- **Roadmap:** background generation with polling, plus phases and steps with status tracking, renaming and deletion.
- **CV creator:** the web editor is desktop-only, so the mobile one is built for the phone. You can create a CV from your profile, for a job offer (AI) or from scratch. Each section is edited in its own sheet, and changes autosave like on the web. You can preview the real PDF (PL/EN, date format, colour theme, GDPR clause), share or print it, tailor it to an offer as a new copy or in place, and run the CV quality audit (`.agents/instructions/cv-quality-audit-design.md`).

Payments are out of scope: the token balance is shown, but nothing can be bought.

The CV PDF is generated on the device (`lib/features/cv/pdf/cv_pdf.dart`, `pdf` package, bundled Poppins). The preview rasterises those exact bytes, so what you see is the file you send. Layout options are stored per CV on the device, like the web keeps them in `localStorage`.

## Running

```bash
cd mobile
flutter pub get
flutter run   # backend: cd VocareWebAPI && dotnet run
```

| `--dart-define` | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8080` (iOS) / `http://10.0.2.2:8080` (Android) — Kestrel endpoint from `appsettings.Development.json` | Backend origin, without `/api` |
| `WEB_BASE_URL` | `https://vocare.pl` | Legal documents, "open on the web" links |
| `GOOGLE_IOS_CLIENT_ID` | — | iOS OAuth client ID |
| `GOOGLE_SERVER_CLIENT_ID` | — | Web client ID used by the backend (required on Android) |
| `LINKEDIN_CLIENT_ID` | — | LinkedIn app client ID |
| `LINKEDIN_REDIRECT_URI` | `https://vocare.pl/api/oauth/mobile/linkedin` | Must be registered in the LinkedIn app |

Plain-HTTP access to the local backend is allowed only for `localhost` on iOS (ATS local networking) and only in Android debug builds.

## Liquid Glass

`lib/core/glass/liquid_glass.dart` exposes one widget, `LiquidGlass`, and it picks the renderer at runtime:

- **iOS 26 and later:** the real `UIGlassEffect` material, hosted as a platform view (`ios/Runner/LiquidGlassView.swift`). Flutter draws the content on top of it.
- **Everywhere else:** a refractive Impeller shader from [`liquid_glass_widgets`](https://pub.dev/packages/liquid_glass_widgets).

The Swift code that uses iOS 26 APIs sits behind `#if compiler(>=6.2)`. Projects built with Xcode 16 therefore still compile, but they always use the shader. **To get the native material, build with Xcode 26 or later.**

Following the iOS 26 guidance, glass is used only for chrome: the tab bar, the header and back buttons, and sheets. Content cards stay opaque so text is always readable.

## Privacy and App Store requirements

- **AI consent (Guideline 5.1.2(i)):** personal data goes to OpenAI only after explicit consent (`lib/features/legal/`). The app asks once after the first sign-in, and every AI action checks again before it sends anything. The decision is stored per user and per notice version (`aiConsentVersion`). It can be withdrawn in Profil → Prywatność i dokumenty, which also links to the Terms of Service and the Privacy Policy.
- **Privacy manifest:** `ios/Runner/PrivacyInfo.xcprivacy` declares no tracking and the collected data types. Keep it in sync with the "App Privacy" answers in App Store Connect.
- **No App Tracking Transparency prompt:** the app has no advertising or analytics SDKs and does not track, so ATT is not needed.
- **Still missing before submission:**
  - **In-app account deletion (5.1.1(v)):** it needs a backend endpoint first.
  - **Sign in with Apple (4.8):** required while Google and LinkedIn login are offered.

## Running on an iPhone

Free (Personal Team) accounts cannot sign `com.vocare.app`, because that id is registered elsewhere. Put your team and a unique development bundle id in the untracked `ios/Flutter/Local.xcconfig`:

```
DEVELOPMENT_TEAM = <your team id>
VOCARE_BUNDLE_ID = com.<you>.vocare.dev
```

The phone cannot reach `localhost`. Start the backend on all interfaces with `Kestrel__EndPoints__Http__Url=http://0.0.0.0:8080 dotnet watch run`, then build with `--dart-define=API_BASE_URL=http://<Mac LAN IP>:8080`.

## Social login setup

**Google**

1. Create an iOS OAuth client in Google Cloud Console.
2. Put its reversed client ID in `ios/Flutter/Vocare.xcconfig` (`GOOGLE_REVERSED_CLIENT_ID`).
3. Pass `GOOGLE_IOS_CLIENT_ID` and `GOOGLE_SERVER_CLIENT_ID` as `--dart-define`s.
4. On Android, register the app's SHA-1 fingerprint in the same Google Cloud project.

**LinkedIn**

LinkedIn accepts only https redirect URIs. Register `https://vocare.pl/api/oauth/mobile/linkedin` in the LinkedIn app. That web route (`frontend/app/api/oauth/mobile/linkedin/route.ts`) forwards the authorization code to `vocare://oauth/linkedin`, and the app then calls `/api/Auth/linkedin-verify`.

Until these values are configured, the social login buttons show a "not configured" message instead of failing silently.

## Deep links

Password-reset e-mails link to `https://vocare.pl/reset-password?token=…&email=…`. The app handles this link through `app_links`, and also handles `vocare://reset-password?…`. For the https link to open the app instead of the browser:

- **iOS:** host `apple-app-site-association` on vocare.pl and add the `applinks:vocare.pl` Associated Domains entitlement.
- **Android:** host `assetlinks.json` on vocare.pl.

## Structure

```text
lib/
├── core/         # design tokens (theme/), Dio client + Result (network/),
│                 # router, Liquid Glass, shared widgets, secure token storage
└── features/     # auth, onboarding, legal, dashboard, profile, notifications,
                  # assistant, market, roadmap, cv, billing, shell
    └── <feature>/data         # repositories (one per backend controller) + models
    └── <feature>/presentation # screens and widgets
```

Repositories return `Result<T, ApiError>` and never throw for expected failures. This mirrors `neverthrow` on the web. The API client attaches the bearer token and retries once after `/api/Auth/refresh` when a refresh token exists. It turns HTTP 401 into sign-out and `403 CONSENTS_REQUIRED` into the consent screen.

## Checks

```bash
flutter analyze
flutter test
# Visual tour of every screen with canned backend responses → build/screenshots/
flutter drive --driver=test_driver/integration_test.dart \
  --target=integration_test/screenshot_tour_test.dart -d <simulator-id>
```

Regenerate the icons and the splash screen after branding changes with `dart run flutter_launcher_icons` and `dart run flutter_native_splash:create`. The icon sources are in `tool/branding/`.
