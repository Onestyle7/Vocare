# Legal Module & Consent Management

This module manages versions of the Terms of Service, the user consent audit trail required by GDPR (RODO), and the **Legal Consents Hard Wall** that blocks users who have not accepted the terms version currently in effect.

---

## 1. Architecture & Enforcement Flow (Hard Wall)

1. **Content lives in the frontend code**: the document text is kept in TypeScript constants and rendered both as an HTML page and as a PDF generated at build time:
   - current version: `frontend/features/marketing/constants/terms-of-service.ts` → `/terms-of-service` and `/terms-of-service/pdf`,
   - archived versions: `terms-of-service-<date>.ts` → `/terms-of-service/<date>` and `/terms-of-service/<date>/pdf` (frozen, never edited),
   - provider data and version dates: `frontend/features/marketing/constants/legal.ts` (`SERVICE_PROVIDER`, `TERMS_VERSION`).
2. **The database decides which version is binding and from when**: the `LegalDocuments` table holds one row per version (`Version` = publication date, `ContentPath` = PDF route, `ValidFrom` = the date the version takes effect for existing users). Rows are added by EF Core data migrations.
3. **Version rule** (`LegalService`, per document type, active rows only):
   - **required** version = the latest one with `ValidFrom <= now`,
   - **newest** version = the latest one overall (its `ValidFrom` may be in the future),
   - a user's consent is valid when they accepted a version with `ValidFrom >=` the required one; otherwise the **newest** version is returned by `/api/legal/pending`,
   - registration (email/password and Google SSO) records consent to the newest version only. Email registration requires `AcceptTermsAndConditions = true`.

   As a result, a new version binds new users from deployment and existing users only from its `ValidFrom` (terms § 18: at least 14 days after the change notice).
4. **Only the Terms of Service require acceptance.** The Privacy Policy is informational (GDPR art. 13): it is not stored in `LegalDocuments` and never blocks access.
5. **Hard Wall enforcement**:
   - the access token (encrypted with `IDataProtectionProvider`, purpose `VocareAuth`) carries the `consents_valid` claim, computed at login and after accepting consents,
   - `LegalConsentsMiddleware` returns **HTTP 403 `CONSENTS_REQUIRED`** for authenticated requests whose token has `consents_valid != true`,
   - allowed bypass endpoints: `/api/legal/*`, `/api/auth/*`, `/health`, `/swagger`,
   - tokens live 1 hour, so a user who logged in before `ValidFrom` may keep access for up to an hour after the new version takes effect.
6. **Frontend behavior**:
   - `app/(app)/layout.tsx` fetches `/api/legal/pending` on each server render; when documents are pending it renders the non-dismissible `LegalConsentModal` instead of the app,
   - **Accept**: stores records in `UserConsents` (timestamp, IP, User-Agent, source), replaces the `token` cookie with a token where `consents_valid = true`, then calls `router.refresh()`,
   - **Delete account**: opens `DeleteAccountDialog`, which soft-deletes and anonymizes the account, then signs the user out,
   - `CONSENTS_REQUIRED` responses are not handled globally yet: a user who is active at the moment `ValidFrom` passes sees errors until the next full page load.

---

## 2. Procedure for Publishing a New Terms Version

> **Critical rules**
> - `ValidFrom` must be at least 14 days after the change notice email is sent (terms § 18 sec. 2).
> - Never deactivate the previous version when publishing a new one. Users without any consent (e.g. new Google SSO accounts) are only prompted while a version with `ValidFrom <= now` is active.
> - Dates must match in three places: `TERMS_VERSION` in `legal.ts`, the frozen validity text of the archived version, and `ValidFrom` in the migration.

### Step 1: Archive the current version (frontend)
1. Copy `terms-of-service.ts` to `terms-of-service-<date>.ts`, replace references to `SERVICE_PROVIDER` / `TERMS_VERSION` with literal values (including the end of validity) and mark the file as not to be edited.
2. Add the `/terms-of-service/<date>` page and the `/terms-of-service/<date>/pdf` route (see `terms-of-service/2025-12-22/` for an example).

### Step 2: Publish the new content (frontend)
1. Edit `terms-of-service.ts` with the new content.
2. Update `TERMS_VERSION` in `legal.ts` (`publishedDate`, `effectiveDate`, `previousVersion`).

### Step 3: Add a data migration (backend)
Create an empty migration (`dotnet ef migrations add <Name> --project VocareWebAPI`) and fill it with SQL. See `20261012143952_UpdateLegalDocumentVersions` for an example.

```sql
-- 1. Point the previous version at its archived PDF (its content no longer lives at /terms-of-service/pdf)
UPDATE "LegalDocuments"
SET "ContentPath" = '/terms-of-service/<previous-date>/pdf'
WHERE "Type" = 'TermsOfService' AND "Version" = '<previous-date>';

-- 2. Add the new version; ValidFrom = midnight Europe/Warsaw on the effective date
INSERT INTO "LegalDocuments" ("Id", "Type", "Version", "ContentPath", "IsActive", "ValidFrom", "CreatedAt")
VALUES (gen_random_uuid(), 'TermsOfService', '<publication-date>', '/terms-of-service/pdf', true, '<effective-date>T00:00:00+01:00', NOW())
ON CONFLICT ("Type", "Version") DO NOTHING;
```

Use `+01:00` in winter (CET) and `+02:00` in summer (CEST).

### Step 4: Deploy and notify users (manual)
1. Deploy frontend and backend together.
2. On the same day, send the change notice email manually (mailing list, or batches from `kontakt@vocare.pl` with addresses in **BCC only**). Recipients: emails of active accounts (`IsDeleted = false`). It is a service message, so it goes to every account regardless of marketing consent.
3. The email must contain: a summary of the changes, the effective date and the fact that further use requires acceptance, the right to terminate with a refund (terms § 18 sec. 4), and a link to the new terms with the PDF attached if possible.
4. Keep the evidence: the recipient export, the email content and the sending confirmation.

### Privacy Policy changes
Edit `frontend/features/marketing/constants/privacy-policy.ts` and `PRIVACY_POLICY_LAST_UPDATED` in `legal.ts`. No migration is needed. For material changes (new purposes or processors), inform users by email.

---

## 3. Post-Deployment Verification Queries

### Inspect document versions
```sql
SELECT "Id", "Type", "Version", "ContentPath", "IsActive", "ValidFrom", "CreatedAt"
FROM "LegalDocuments"
ORDER BY "Type", "ValidFrom" DESC;
```

### Track acceptance per version
```sql
SELECT
    d."Type",
    d."Version",
    d."ValidFrom",
    COUNT(c."Id") AS "AcceptedCount"
FROM "LegalDocuments" d
LEFT JOIN "UserConsents" c ON d."Id" = c."LegalDocumentId"
WHERE d."IsActive" = true
GROUP BY d."Id", d."Type", d."Version", d."ValidFrom"
ORDER BY d."Type", d."ValidFrom";
```

Right after deploying a new version, existing accounts must have no consent to it (only accounts created after the deployment).

---

## 4. Emergency Rollback Procedure

If a published version contains errors, deactivate it before its `ValidFrom` passes. The previous version stays required, so existing users are not blocked:

```sql
UPDATE "LegalDocuments"
SET "IsActive" = false
WHERE "Type" = 'TermsOfService' AND "Version" = '<publication-date>';
```

Only active versions count, so users who registered in the meantime (consent to the deactivated version only) are asked to accept the previous version right away. Revert the frontend content in the same deployment, so the modal links to the text the user actually accepts.

---

## 5. GDPR Consent Audit Trail for Deleted Accounts

Per GDPR art. 7(1) in conjunction with art. 17(3)(e):
- Account deletion is a soft delete: personal data is purged and the account is anonymized (`IsDeleted = true`).
- `AccountAntiAbuseRegistry` keeps the account's `UserId` with an HMAC SHA-256 hash of its email.
- The same row carries the one-time benefit flags checked when the email registers again: `HadWelcomeBonus` (welcome tokens), `HadConsentDiscount` (consent discount granted) and `HadSubscription` (Premium subscription used, including a trial). The Privacy Policy describes this purpose.
- `UserConsents` records keep their original `UserId`, preserving the proof chain:
  ```text
  email -> HMAC SHA-256 -> AccountAntiAbuseRegistry.UserId -> UserConsents (AcceptedAt, IpAddress, UserAgent)
  ```
- `MarketingConsents` records are not deleted: deleting the account marks the consent as withdrawn (`IsConsentGiven = false`, `ConsentWithdrawnDate`).
- According to the Privacy Policy, consent history and email hashes are kept for 6 years after account deletion. Automatic removal is not implemented yet.

---

## 6. Requests About Advertising Pixel Data (TikTok, Meta)

With advertising consent, the frontend loads the TikTok and Meta pixels. For collecting this data and sending it to them, Vocare is a joint controller with each platform (GDPR art. 26). After that, TikTok and Meta process the data as independent controllers. The Privacy Policy describes this split.

| | TikTok | Meta |
| :--- | :--- | :--- |
| Joint controller | TikTok Technology Limited (Ireland) and TikTok Information Technologies UK Limited | Meta Platforms Ireland Limited |
| Joint processing | Collection and transmission; measurement and insight reporting | Collection and transmission |
| Source | Jurisdiction Specific Terms, Part B (effective 5 Feb 2026; behind the Ads Manager login) | [Controller Addendum](https://www.facebook.com/legal/controller_addendum) (effective 25 Apr 2023) |

Vocare informs users and collects consent. Each platform handles access, rectification, erasure, restriction and portability requests (GDPR art. 15-20) for the data it stores.

When a request about pixel data reaches kontakt@vocare.pl, or a supervisory authority asks about it:
1. Forward it to the platform:
   - **Meta:** within **7 calendar days**, using the form linked from the Controller Addendum ("formularz").
   - **TikTok:** promptly, via https://www.tiktok.com/legal/report/privacy.
2. Do not answer on the platform's behalf. Vocare forwards the request and then cooperates.
3. If the person also objects (art. 21) or withdraws consent, handle that for Vocare's own processing: point them to vocare.pl/preferences, where withdrawal stops the pixels and deletes their cookies.

---

## 7. Cookie Consent Records (proof of consent)

GDPR art. 7(1) requires Vocare to be able to show that a visitor consented to analytics (GA4) or advertising pixels (TikTok, Meta), or withdrew that consent. TikTok's terms also require "verifiable" consents. The cookies in the visitor's browser drive the tools, but they can't serve as proof: the visitor can delete them and Vocare can't read them. Every choice is therefore also appended to the `CookieConsentRecords` table.

### Flow
1. The visitor decides in the cookie banner, on `/preferences` or in account settings. The frontend saves the choice in the `cookie_consent` and `ads_consent` cookies.
2. `lib/utils/consent-record.ts` gives the browser a random `consent_id` cookie (12 months, renewed with each choice) and calls the `recordCookieConsent` server action without waiting for it.
3. The server action reads the choices from the request's cookies and calls `POST /api/legal/cookie-consent` through `legalApiClient`. The request carries `X-Internal-Api-Key` and the visitor's IP, plus the user's token when signed in.
4. `LegalController.RecordCookieConsent` rejects requests without a valid internal key (`[RequireInternalApiKey]`). It is rate limited per visitor IP (`CookieConsentPolicy`, 20/min) and stores the `UserId` when the token is valid.

### What a record holds
| Column | Meaning |
| :--- | :--- |
| `ConsentId` | The browser's `consent_id`; links all choices made in one browser |
| `UserId` | The account, when the visitor was signed in; otherwise `NULL` |
| `AnalyticsGranted`, `AdsGranted` | The choices after the decision (a choice not made yet is stored as `false`) |
| `Source` | `Banner`, `Preferences` or `Account` |
| `TextVersion` | `COOKIE_CONSENT_TEXT_VERSION` from `frontend/features/marketing/constants/legal.ts`: the date of the banner and cookie texts the visitor saw (the texts themselves are in git history) |
| `CreatedAt` | Server time (UTC) |

Records are only appended, never updated, so the history also shows withdrawals. No IP address or User-Agent is stored: the Privacy Policy promises this, and `ConsentId` is enough to link a record to a browser.

**When the banner, `/preferences` texts or the "Pliki cookies" section of the Privacy Policy change, update `COOKIE_CONSENT_TEXT_VERSION`.** Otherwise records point to the wrong text.

### Retention
`CookieConsentCleanupJob` (Hangfire, daily at 03:00 UTC) deletes records older than `CookieConsent:RetentionYears` (3, pending the lawyer's confirmation). The Privacy Policy states "3 lata od dokonania danego wyboru". Account deletion doesn't remove records, the same as for `UserConsents` (§ 5).

### Checking someone's consent history
By browser (the person reads `consent_id` from their cookies) or by account:
```sql
SELECT "CreatedAt", "Source", "AnalyticsGranted", "AdsGranted", "TextVersion", "UserId"
FROM "CookieConsentRecords"
WHERE "ConsentId" = '<consent_id>'   -- or: WHERE "UserId" = '<user id>'
ORDER BY "CreatedAt";
```
The latest row is the choice in force at that time. Requests about the pixel data held by TikTok or Meta follow § 6.
