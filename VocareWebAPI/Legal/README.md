# Legal Module & Consent Management

This module manages the lifecycle of legal documents (Terms of Service, Privacy Policy), user consent auditing in compliance with GDPR (RODO), and the enforcement of the **Legal Consents Hard Wall** for users who have not accepted the active document versions.

---

## 1. Architecture & Enforcement Flow (Hard Wall)

1. **Source of Truth**: The `LegalDocuments` PostgreSQL table maintains version records. Only documents with `IsActive = true` are required to access the platform.
2. **Static Asset Storage**: Document files (PDFs) are stored in `frontend/public/legal/` (e.g., `/legal/terms-v1.1.pdf`) and served directly by Next.js.
3. **Hard Wall Enforcement**:
   - JWT tokens include the `"consents_valid": true | false` claim.
   - `LegalConsentsMiddleware` intercepts API requests. If a user lacks consent for any currently active document, the API returns **HTTP 403 `CONSENTS_REQUIRED`**.
   - Allowed bypass endpoints: `/api/legal/*`, `/api/auth/*`, `/health`, `/swagger`.
4. **Frontend Behavior**:
   - Upon encountering `CONSENTS_REQUIRED`, the non-dismissible `LegalConsentModal` blocks navigation.
   - The user has two options:
     - **Accept** new versions: Persists records in `UserConsents`, refreshes the JWT token in-place without page reload.
     - **Decline / Delete Account**: Triggers `DeleteAccountDialog`, performs an atomic soft delete and personal data cleanup, then signs the user out.

---

## 2. Procedure for Deploying a New Document Version

> **Critical Rule**: Updating legal documents is an atomic operation. Always deploy the static PDF asset on the frontend first before activating the new version in the database.

### Step 1: Deploy Static Asset on Frontend
1. Add the new PDF version to:
   ```text
   frontend/public/legal/terms-v1.1.pdf
   ```
2. Deploy the frontend and verify the file is publicly accessible:
   `https://<domain>/legal/terms-v1.1.pdf`.

---

### Step 2: Activate New Version in the Database (SQL Scripts)

Execute the script within a single transaction (`BEGIN ... COMMIT`). The script deactivates the previous active version of that type and inserts the new version with `IsActive = true`.

#### A. Terms of Service Rollout

```sql
BEGIN;

-- 1. Deactivate current active Terms of Service
UPDATE "LegalDocuments"
SET "IsActive" = false
WHERE "Type" = 'TermsOfService' AND "IsActive" = true;

-- 2. Insert and activate the new version
INSERT INTO "LegalDocuments" (
    "Id",
    "Type",
    "Version",
    "ContentPath",
    "IsActive",
    "ValidFrom",
    "CreatedAt"
) VALUES (
    gen_random_uuid(),
    'TermsOfService',
    '1.1',
    '/legal/terms-v1.1.pdf',
    true,
    NOW(),
    NOW()
);

COMMIT;
```

#### B. Privacy Policy Rollout

```sql
BEGIN;

-- 1. Deactivate current active Privacy Policy
UPDATE "LegalDocuments"
SET "IsActive" = false
WHERE "Type" = 'PrivacyPolicy' AND "IsActive" = true;

-- 2. Insert and activate the new version
INSERT INTO "LegalDocuments" (
    "Id",
    "Type",
    "Version",
    "ContentPath",
    "IsActive",
    "ValidFrom",
    "CreatedAt"
) VALUES (
    gen_random_uuid(),
    'PrivacyPolicy',
    '1.1',
    '/legal/privacy-v1.1.pdf',
    true,
    NOW(),
    NOW()
);

COMMIT;
```

---

## 3. Post-Deployment Verification Queries

### Inspect Currently Active Documents
```sql
SELECT "Id", "Type", "Version", "ContentPath", "IsActive", "ValidFrom", "CreatedAt"
FROM "LegalDocuments"
ORDER BY "Type", "CreatedAt" DESC;
```

### Track Consent Acceptance Rates
```sql
SELECT 
    d."Type",
    d."Version",
    d."IsActive",
    COUNT(c."Id") AS "AcceptedCount"
FROM "LegalDocuments" d
LEFT JOIN "UserConsents" c ON d."Id" = c."LegalDocumentId"
WHERE d."IsActive" = true
GROUP BY d."Id", d."Type", d."Version", d."IsActive";
```

---

## 4. Emergency Rollback Procedure

If a deployed document contains errors or immediate reversal is required:

```sql
BEGIN;

-- 1. Deactivate the erroneous version
UPDATE "LegalDocuments"
SET "IsActive" = false
WHERE "Type" = 'TermsOfService' AND "Version" = '1.1';

-- 2. Reactivate the previous stable version
UPDATE "LegalDocuments"
SET "IsActive" = true
WHERE "Type" = 'TermsOfService' AND "Version" = '1.0';

COMMIT;
```

---

## 5. GDPR Consent Audit Trail for Deleted Accounts

Per GDPR (Art. 7(1) in conjunction with Art. 17(3)(e)):
- Account deletion purges and anonymizes PII (`IsDeleted = true`).
- `AccountAntiAbuseRegistry` retains the user's `UserId` alongside the HMAC SHA-256 hash of their email.
- Records in `UserConsents` are preserved with their original `UserId`, maintaining the legal proof chain:
  ```text
  email -> HMAC SHA-256 -> AccountAntiAbuseRegistry.UserId -> UserConsents (AcceptedAt, IpAddress, UserAgent)
  ```
