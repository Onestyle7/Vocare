---
name: auditing-cv-quality
description: Use when implementing or modifying CV analysis, scoring components, CV recommendations, or CV tailoring UI and API integrations
---

# Auditing CV Quality & Content Scoring

## Overview

The CV Quality Audit module (`VocareWebAPI/CvGenerator/` and `frontend/features/resume/`) evaluates CV content completeness, clarity, and relevance using AI. This skill enforces strict UX and business rules defined in [.agents/instructions/cv-quality-audit-design.md](../../instructions/cv-quality-audit-design.md): accurate presentation of scores, zero false ATS guarantees, explicit token usage boundaries, and compliant rendering of the 8 canonical CV sections.

---

## When to Use

Use this skill when:

- Building or styling the CV analysis panel, score cards, or recommendation widgets.
- Interacting with `POST /api/cvs/analyze/{cvId}` or `GET /api/cvs/analysis/{cvId}`.
- Mapping section scores and improvement insights to CV editor fields.
- Authoring UI copy or tooltips related to CV evaluation.

When **NOT** to use:

- PDF generation and visual template styling (use `@react-pdf/renderer` tools).
- General profile editing unrelated to quality scoring.

---

## Rationalization Table

| Excuse / Rationalization                                                                              | Reality in Vocare Architecture                                                                                                                                                                                                                     |
| :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _"The backend returned `targetPositionScore: 0`, so displaying `0%` in red is technically accurate."_ | If the user has not set a target position, the score is mathematically 0. Showing a failing red `0%` punishes the user for an unset optional field. The UI must hide the number and show a CTA card to set the target role.                        |
| _"Using marketing phrases like 'Passes every ATS' or '80% chance of hiring' improves conversion."_    | Strictly forbidden by product guidelines ([.agents/instructions/cv-quality-audit-design.md](../../instructions/cv-quality-audit-design.md)). The audit evaluates raw content quality, not PDF layout parsing by proprietary ATS engines. |
| _"I should trigger re-analysis automatically whenever the user stops typing (autosave)."_             | Each analysis costs 10 tokens (`AnalyzeCv`). Automatic triggers deplete user balances without consent. Analysis must ONLY run on explicit button click ("Analizuj CV").                                                                            |
| _"English section names like `Basics` or `Work` are clear enough."_                                   | The user-facing interface must use localized Polish labels and map smoothly to editor tabs (`profile`, `experience`, `skills`, etc.).                                                                                                              |

---

## Red Flags - STOP and Fix

- Displaying `0%` or a red progress bar when `targetPosition` is null or empty.
- Any copy promising guaranteed hiring, ATS compliance, or job interview rates.
- Invoking `POST /api/cvs/analyze/{cvId}` on page load or within an `useEffect` without user interaction.
- Rendering English keys (`Basics`, `Work`, `Certificates`) directly to the user.
- Missing keyboard accessibility or missing text labels next to circular score indicators.

---

## The 8 Canonical CV Sections Contract

The backend returns `sectionScores` containing these 8 exact section keys. Frontend components must translate them to Polish labels and link to corresponding editor anchors:

| `sectionName` (Backend) | Polish UI Label   | Editor Anchor Target    |
| :---------------------- | :---------------- | :---------------------- |
| `Basics`                | Dane podstawowe   | `#section-profile`      |
| `Work`                  | Doświadczenie     | `#section-experience`   |
| `Education`             | Wykształcenie     | `#section-education`    |
| `Certificates`          | Certyfikaty       | `#section-certificates` |
| `Skills`                | Umiejętności      | `#section-skills`       |
| `Languages`             | Języki            | `#section-languages`    |
| `Projects`              | Projekty          | `#section-projects`     |
| `Social`                | Linki i portfolio | `#section-social`       |

---

## Score Tiers & Visual Semantics

Overall scores (`overallScore` 0–100) must be paired with descriptive labels and semantic colors. Never rely on color alone:

| Score Range  | Text Badge            | UI Semantic Intent                            |
| :----------- | :-------------------- | :-------------------------------------------- |
| **0 – 39**   | "Wymaga uzupełnienia" | Encouraging tone, highlights missing sections |
| **40 – 69**  | "Dobry fundament"     | Solid basis, ready for polish                 |
| **70 – 84**  | "Dobre CV"            | Competitive document                          |
| **85 – 100** | "Bardzo mocne CV"     | Excellent quality and depth                   |

Accent color: `#915EFF` (Vocare Violet) and its semi-transparent variants.

---

## Implementation Patterns

### 1. Handling Target Position Score Safely

File: `frontend/features/resume/components/TargetPositionScoreCard.tsx`

```tsx
interface Props {
  targetPosition?: string | null;
  score: number;
  onSetTargetPosition: () => void;
}

export function TargetPositionScoreCard({
  targetPosition,
  score,
  onSetTargetPosition,
}: Props) {
  // CRITICAL RULE: If no target position is specified, DO NOT show 0%
  if (!targetPosition || targetPosition.trim() === "") {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/40">
        <p className="text-sm font-medium text-muted-foreground">
          Dopasowanie do stanowiska
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Ustaw stanowisko docelowe w edytorze, aby sprawdzić stopień
          dopasowania Twojego CV.
        </p>
        <button
          onClick={onSetTargetPosition}
          className="mt-3 text-xs font-semibold text-[#915EFF] hover:underline"
        >
          Ustaw stanowisko docelowe &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <span className="text-xs text-muted-foreground">
        Dopasowanie do: {targetPosition}
      </span>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-2xl font-bold">{score}%</span>
      </div>
    </div>
  );
}
```

### 2. Approved UI Copy Guidelines

Always use:

- _"Analiza jakości CV"_
- _"Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności."_
- _"Wynik ogólny"_
- _"Największy wpływ"_
- _"Popraw sekcję"_
- _"Analiza może wykorzystać środki z Twojego planu (10 tokenów)."_
- _"Ocena dotyczy treści CV. Nie jest gwarancją przejścia przez konkretny system ATS."_

Never use:

- _"Twoje CV przejdzie każdy ATS"_
- _"Masz 80% szans na zatrudnienie"_
- _"Gwarantowany sukces"_
