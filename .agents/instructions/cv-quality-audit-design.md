---
title: CV Quality Audit UI/UX Design Specification
description: UI/UX specification, view hierarchy, accessibility standards, backend contracts, and interface copywriting guidelines for the CV Quality Audit panel in Vocare.
version: 1.0
last_updated: 2026-09-12
target_audience: Frontend engineers, UI/UX designers, and AI agents
---

# CV Quality Audit — UI/UX Design Brief & Specification

## 1. Document Purpose

This document specifies the CV Quality Audit interface in the Vocare web application. It serves as the single source of truth for UI/UX designers and frontend engineers. All specifications strictly adhere to data currently available from the backend; proposed future API enhancements are clearly designated in a dedicated section.

---

## 2. Product Context

**Vocare** is an AI-powered career development platform. The CV module enables users to create, edit, version, and export resumes. The AI-driven CV Quality Audit helps candidates assess the substance and completeness of their resume content and highlights highest-impact improvements.

> [!IMPORTANT]
> The audit evaluates the **content and completeness** of structured CV data. It is **not** a technical parse of the final PDF rendering and does not guarantee parsing success in proprietary ATS systems. The user interface must use terms like **"CV Quality Audit"** or **"CV Evaluation"**, never *"guaranteed ATS score"*.

---

## 3. Surface Placement & User Flow

The audit primarily resides inside the **Single CV Editor**:

- **"Analyze CV" action button** in the editor's top navigation bar.
- **Desktop**: Slide-over right drawer/panel (width: 400–480px), accessible without navigating away from the active CV editor.
- **Mobile**: Full-screen modal sheet or bottom drawer.
- **Dashboard (Future)**: Quick score badge on the CV card (pending CV list API enhancement).

Candidates must be able to click directly on any recommendation to jump smoothly to the corresponding form section in the editor.

---

## 4. Backend API Contract

### Trigger Analysis
`POST /api/cvs/analyze/{cvId}`
- Requires authentication (`[Authorize]`).
- Verifies CV ownership by the authenticated user.
- Metered service: billed as `AnalyzeCv` (consumes 10 tokens / quota).
- Creates the initial analysis or overwrites the previous audit result.
- Long-running operation (calls external LLM; client timeouts must accommodate up to 3 minutes).

### Fetch Latest Analysis
`GET /api/cvs/analysis/{cvId}`
- Returns the latest stored audit result.
- Returns HTTP 404 (`CvAnalysisNotFoundException`) if no analysis has been executed yet.
- Fetching an existing result is completely free (0 tokens) and must never be displayed as a paid re-run.

### Response Schema

```typescript
interface CvAnalysisResult {
  overallScore: number; // 0–100
  targetPositionScore: number; // 0–100; backend returns 0 when targetPosition is unset
  sectionScores: Array<{
    sectionName: string;
    score: number; // 0–100
    insights: string[];
  }>;
  topImprovements: string[];
}
```

### The 8 Canonical Sections Mapping

The backend produces scores strictly across these 8 section keys:

| `sectionName` (Backend) | Polish UI Label | Editor Section / Anchor |
| :--- | :--- | :--- |
| `Basics` | Dane podstawowe | `profile` (`#section-profile`) |
| `Work` | Doświadczenie | `experience` (`#section-experience`) |
| `Education` | Wykształcenie | `education` (`#section-education`) |
| `Certificates` | Certyfikaty | `certificates` (`#section-certificates`) |
| `Skills` | Umiejętności | `skills` (`#section-skills`) |
| `Languages` | Języki | `languages` (`#section-languages`) |
| `Projects` | Projekty | `projects` (`#section-projects`) |
| `Social` | Linki i portfolio | `profile` / social links |

> [!CAUTION]
> The frontend must never render technical English keys (`Basics`, `Work`, etc.) directly to end users. Furthermore, the UI must gracefully handle unexpected or unrecognized section names without crashing.

---

## 5. View Hierarchy & Layout

### 1. Panel Header
- **Title**: „Analiza jakości CV”
- **CV Title**: Name of the active resume version.
- **Target Position**: Displayed if configured (`targetPosition`).
- **Primary Action**: „Analizuj CV” (initial) or „Analizuj ponownie” (re-run).
- **Cost Notice**: If the dynamic price is known, display it. Otherwise, use neutral copy: *„Analiza może wykorzystać środki z Twojego planu.”* (Never hardcode token amounts into UI components).
- **Dismiss Control**: Close panel without losing unsaved form input in the editor.

### 2. Score Summary
- **Primary Metric**: `overallScore` rendered as a prominent numerical fraction: `74/100`. A circular progress ring may be used, but textual representation is mandatory for accessibility.
- **Performance Tiers**:
  - `0–39`: „Wymaga uzupełnienia” (Needs Work)
  - `40–69`: „Dobry fundament” (Good Foundation)
  - `70–84`: „Dobre CV” (Strong Resume)
  - `85–100`: „Bardzo mocne CV” (Exceptional Resume)
- Color must never be the sole conveyor of information; each tier requires text and an icon. Avoid alarmist red styling for low scores; the audit motivates action rather than penalizes.
- **Target Position Alignment**: If `targetPosition` is populated, render `targetPositionScore` as *„Dopasowanie do: {targetPosition}”*. If `targetPosition` is empty:
  - **DO NOT** display `0%`.
  - Render an actionable CTA card:
    > *„Ustaw stanowisko docelowe, aby sprawdzić dopasowanie CV.”*

### 3. Top Improvements ("Highest Impact")
- Displays `topImprovements` as up to 3 numbered action items.
- Each action item includes:
  - Concise recommendation text.
  - Client-side session toggle: „Do zrobienia” (temporary UI state; not persisted to the backend).
  - Direct navigation button: „Przejdź do sekcji” when target section can be resolved.
  - No speculative claims regarding how many points the score will rise (the backend does not calculate point delta predictions).

### 4. Section Scores
- 8 section items rendered in a compact accordion (desktop drawer) or grid of cards (full-page view), sorted from lowest to highest score.
- Each section includes:
  - Polish section title.
  - Score ratio: `score/100`.
  - Progress bar.
  - Bulleted list of `insights`.
  - Action button: „Popraw sekcję”, which scrolls the editor to the corresponding form field.
- A section with a score of `0` due to empty data must display a clear *„Uzupełnij”* CTA rather than an error state.

---

## 6. Interface States

| State | UI Behavior |
| :--- | :--- |
| **Empty State** (No previous audit) | Explain what the audit measures across the 8 areas. Main CTA: „Analizuj CV”. Note that it evaluates content, not PDF styling. An API 404 on `GET` is a valid empty state, not an error. |
| **Analyzing** (Loading) | Disable trigger button to prevent duplicate requests. Allow continued editing/viewing. Show phased status copy (*„Sprawdzamy kompletność sekcji”*, *„Oceniamy doświadczenie i osiągnięcia”*). Do not display fake progress percentages. Accommodate up to 3-minute request timeouts. |
| **Success** | Smoothly reveal the score breakdown and highlight top 3 improvements. Preserve results in memory and re-fetch via `GET` on subsequent drawer opens. |
| **Error** | Handle expired sessions, insufficient token balance, network drops, or 500 errors. Provide clear explanation and a safe „Spróbuj ponownie” retry action. Do not clear existing valid scores if a re-analysis fails. |
| **Missing Target Position** | `targetPositionScore: 0` is not a failure. Hide numeric score; render a CTA pointing to the target position input. |
| **Post-Analysis Editing** | The current backend does not return an analysis timestamp or revision hash. The frontend must not speculate or mark the score as outdated until timestamp tracking is added to the API. |

---

## 7. Interaction Rules & Behavior

1. Opening the audit panel executes `GET /api/cvs/analysis/{cvId}`.
2. If `GET` returns 404, display the empty state.
3. Clicking „Analizuj CV” executes `POST /api/cvs/analyze/{cvId}`.
4. Clicking „Popraw sekcję” collapses or closes the panel and focuses the corresponding editor form anchor.
5. After editing CV data, re-analysis must be initiated **manually** by the user. Never trigger analysis on autosave or input blur.
6. Never automatically trigger paid analysis upon route navigation or page load.
7. Bound all rendered score values defensively to `[0, 100]` on the client side.

---

## 8. Visual & Styling Guidelines

- **Framework & Libraries**: Next.js 16, React 19, Tailwind CSS v4, `shadcn/ui`, Lucide icons.
- **Typography**: Application font tokens (`font-grotesk`).
- **Brand Accent**: Purple `#915EFF` (`rgb(145, 94, 255)`) and its semi-transparent tokens.
- **Theme Support**: Flawless Dark and Light mode support using semantic tokens (`background`, `foreground`, `muted`, `muted-foreground`, `border`).
- **Motion**: Functional, subtle transitions adhering to `prefers-reduced-motion`.
- **Tone**: Professional, encouraging career audit tool—not an exam or gamified leaderboard.

---

## 9. Responsiveness

- **Desktop (≥ 1024px)**: Slide-over right drawer (400–480px width) with independent scrolling; editor remains visible and interactable.
- **Tablet (768px – 1023px)**: 45–55% split drawer or centered dialog.
- **Mobile (< 768px)**: Full-screen modal sheet with sticky header and close button. Touch targets minimum 44 × 44px. No hover-dependent UI.

---

## 10. Accessibility (a11y)

- All scores must have plain-text equivalents.
- Progress bars must supply `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
- Contrast ratios must comply with WCAG 2.1 AA.
- Keyboard focus must return to the trigger button when the drawer closes.
- Screen readers must receive an `aria-live="polite"` announcement upon audit completion (*„Analiza CV jest gotowa”*).
- All accordions and disclosure widgets must be fully keyboard operable.

---

## 11. Interface Copywriting

### Prescribed Polish Copy
- „Analiza jakości CV”
- „Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności.”
- „Wynik ogólny”
- „Dopasowanie do stanowiska”
- „Największy wpływ”
- „Ocena sekcji”
- „Popraw sekcję”
- „Analizuj CV”
- „Analizuj ponownie”
- „Analiza może wykorzystać środki z Twojego planu.”
- „Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS.”

### Prohibited Copy
- ❌ *„Twoje CV przejdzie każdy ATS”*
- ❌ *„Masz 80% szans na zatrudnienie”*
- ❌ *„Gwarantowany sukces”*
- ❌ *„AI znalazło wszystkie błędy”*

---

## 12. Recommended Backend Enhancements (Future Scope)

To maximize audit efficacy, the following API extensions are recommended:

```typescript
interface CvAnalysisResponse extends CvAnalysisResult {
  cvId: string;
  cvVersionAtAnalysis: number;
  currentCvVersion: number;
  analyzedAt: string;
  isOutdated: boolean;
}
```

1. **Version & Timestamp**: Return `analyzedAt` and `cvVersionAtAnalysis` on `GET /api/cvs/analysis/{cvId}` to indicate outdated audits.
2. **Schema Validation**: Enforce strict 0–100 ranges and validate the 8 required section names on the backend.
3. **Audit History or Unique Index**: Ensure clean uniqueness or support full historical audit snapshots.
4. **Stable Identifiers**: Introduce `sectionId` and `insightId` for robust client-side tracking.
5. **Cost Discovery**: Expose the dynamic token cost of `AnalyzeCv` via an endpoint rather than assuming 10 tokens on the client.

---

## 13. UI/UX Acceptance Criteria

- [ ] Users clearly distinguish overall score from target position alignment.
- [ ] An unset target position renders an actionable CTA card, never a `0%` score.
- [ ] Users can identify the top 3 highest-impact improvements within seconds.
- [ ] Every evaluated section includes a score, insights, and a direct navigation link to the editor.
- [ ] All states are implemented: empty, loading, success, error, insufficient tokens, and missing target position.
- [ ] The interface makes zero false promises regarding ATS compatibility or employment rates.
- [ ] Re-analysis requires an intentional click and is never executed automatically.
- [ ] Works seamlessly across desktop drawer, tablet, and mobile full-screen views in both light and dark modes.
