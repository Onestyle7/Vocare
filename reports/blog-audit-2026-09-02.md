# Blog Audit Report

**Audit Date:** 2026-09-02
**Scope:** `frontend/features/blog/articles/` (35 published posts + 3 unpublished drafts, underscore-prefixed)
**Analyzer:** canonical `analyze_blog.py` (5-category, 100-point scoring, batch JSON)

> Note: this pass covers content/on-page/link/freshness/AI-readiness signals available from static files. Search Console, PageSpeed/CWV, and live crawler-access checks were **SKIPPED: credentials unavailable** (no `blog-google` config present in this project). Sitemap/robots.txt/canonical/redirect checks were **SKIPPED: no deployed site config found in repo** (Next.js app router blog with no static `sitemap.xml`/`robots.txt` located under `frontend/public`).

## Health Overview

| Metric | Count |
|---|---|
| Total published posts | 35 |
| Unpublished drafts (`_`-prefixed) | 3 |
| Average score (published) | 54.7 / 100 |
| Posts scoring 90+ (Excellent) | 0 |
| Posts scoring 70-89 (Good) | 0 |
| Posts scoring 50-69 (Needs Work) | 35 |
| Posts scoring <50 (Poor) | 0 (published) / 3 (drafts) |
| Orphan pages (0 inbound internal links) | 35 / 35 (100%) |
| Dead-end pages (0 outbound internal links) | 34 / 35 (97%) |
| Posts with any JSON-LD schema | 0 / 35 |
| Posts with Open Graph tags | 0 / 35 |
| Posts with `lastUpdated`/`dateModified` | 0 / 35 |
| Cannibalization clusters flagged | 8 |

**Headline finding:** every published post lands in the same 51–58 "Needs Work" band, and the *same four issues* recur on every single post. This is not 35 independent content problems — it's a handful of template-level gaps repeated 35 times. Fixing those systematically (internal linking, schema, OG tags) will lift the whole site's average score more than editing any individual article.

## Per-Post Scores (sorted low to high)

| Post | Score | Content /30 | SEO /25 | E-E-A-T /15 | Technical /15 | AI Citation /15 |
|---|---|---|---|---|---|---|
| przykladowe-cv.md | 51 | 14 | 17 | 7 | 5 | 8 |
| zawody-przyszlosci-2026.md | 51 | 13 | 18 | 7 | 5 | 8 |
| jaki-zawod-wybrac.md | 52 | 13 | 18 | 7 | 5 | 9 |
| najlepiej-platne-zawody.md | 52 | 14 | 18 | 7 | 5 | 8 |
| test-kompetencji-zawodowych.md | 52 | 14 | 18 | 7 | 5 | 8 |
| umiejetnosci-do-cv.md | 52 | 14 | 18 | 7 | 5 | 8 |
| wzor-cv.md | 52 | 14 | 18 | 7 | 5 | 8 |
| cv-studenta.md | 53 | 14 | 18 | 8 | 5 | 8 |
| doradca-zawodowy.md | 53 | 14 | 18 | 7 | 5 | 9 |
| doradztwo-zawodowe.md | 53 | 14 | 18 | 7 | 5 | 9 |
| jak-zmienic-branze.md | 53 | 15 | 18 | 7 | 5 | 8 |
| wypalenie-zawodowe-co-dalej.md | 53 | 15 | 18 | 7 | 5 | 8 |
| zawody-przyszlosci.md | 53 | 14 | 18 | 8 | 5 | 8 |
| cv-bez-doswiadczenia.md | 54 | 16 | 18 | 7 | 5 | 8 |
| gdzie-szukac-pracy.md | 54 | 16 | 18 | 7 | 5 | 8 |
| jak-napisac-cv.md | 54 | 16 | 18 | 7 | 5 | 8 |
| jak-znalezc-prace.md | 54 | 16 | 18 | 7 | 5 | 8 |
| profesjonalne-cv.md | 54 | 16 | 18 | 7 | 5 | 8 |
| szukanie-pracy.md | 54 | 16 | 18 | 7 | 5 | 8 |
| test-kariery-online.md | 54 | 15 | 18 | 7 | 5 | 9 |
| wzor-listu-motywacyjnego.md | 54 | 16 | 18 | 7 | 5 | 8 |
| kreator-cv.md | 55 | 16 | 18 | 8 | 5 | 8 |
| praca-bez-doswiadczenia.md | 55 | 16 | 18 | 8 | 5 | 8 |
| praca-dla-studenta.md | 55 | 16 | 18 | 7 | 5 | 9 |
| rozmowa-kwalifikacyjna.md | 55 | 16 | 18 | 7 | 5 | 9 |
| sciezka-kariery.md | 55 | 16 | 18 | 7 | 5 | 9 |
| zainteresowania-w-cv.md | 55 | 16 | 18 | 7 | 5 | 9 |
| cv.md | 56 | 18 | 18 | 7 | 5 | 8 |
| pytania-na-rozmowie-kwalifikacyjnej.md | 56 | 18 | 18 | 7 | 5 | 8 |
| cv-do-pracy.md | 57 | 18 | 18 | 7 | 6 | 8 |
| cv-wzor.md | 57 | 18 | 18 | 7 | 6 | 8 |
| jak-zrobic-cv.md | 57 | 18 | 18 | 8 | 5 | 8 |
| darmowy-kreator-cv.md | 58 | 18 | 18 | 8 | 6 | 8 |
| jak-napisac-list-motywacyjny.md | 58 | 20 | 18 | 7 | 5 | 8 |
| list-motywacyjny.md | 58 | 20 | 18 | 7 | 5 | 8 |

**Drafts (unpublished, `_`-prefixed — excluded from averages above):**

| Post | Score | Notes |
|---|---|---|
| _szukanie-pracy-w-dobie-ai.md | 48 | Thin: 0 external citations, 1 stray image-link counted as "internal" |
| _ukryty-rynek-pracy.md | 46 | Thin, no links at all |
| _doradca-finansowy-kiedy-skorzystac.md | 40 | Weakest file in the repo; off-topic for a career/CV brand (finance advisory) — confirm before publishing |

## Site-Wide Issue Frequency (35 published posts)

| Issue | Posts Affected | % |
|---|---|---|
| No internal links (0 outbound) | 34 / 35 | 97% |
| No JSON-LD schema (BlogPosting) | 35 / 35 | 100% |
| No Open Graph / social meta tags | 35 / 35 | 100% |
| No `lastUpdated`/`dateModified` in frontmatter | 35 / 35 | 100% |
| No differentiated evidence/original data (stats, case examples, unique insight) | 35 / 35 | 100% |
| Limited reader utility (no table/example/decision aid) | 35 / 35 | 100% |
| No entity definitions (`**term** is/are` patterns) | 35 / 35 | 100% |
| Sentences over 40 words (readability) | 30 / 35 | 86% |
| No inline source citations | ~3 / 35 | 9% (most posts have some external links, tier 3 sources) |

These seven items are template-level, not per-post. Recommended build-time/CMS-level fixes:

1. **Internal linking module** — add a related-posts / contextual-link component to the MDX/markdown render pipeline (or require 3–10 in-body links per post at write time). This single fix touches 34 of 35 posts.
2. **BlogPosting + Person + Organization JSON-LD** — generate once in `frontend/app/blog/[category]/[slug]/page.tsx` from frontmatter (title, description, date, author, coverImage) rather than per-post. Fixes 35/35 in one code change. Use `/blog schema` or `blog-schema` skill to generate the template.
3. **Open Graph / Twitter Card meta** — same fix location, same one-time win for all 35 posts.
4. **`dateModified`/`lastUpdated` frontmatter field** — add to the content schema and backfill with each post's `date` value as a starting point; update on real edits going forward.

## Prioritized Action Queue (Top 10, lowest score first)

| Priority | Post | Score | Top Issue | Recommended Action |
|---|---|---|---|---|
| 1 | przykladowe-cv.md | 51 | No internal links; thin evidence/original data | Add 3-10 internal links to cv-wzor.md, wzor-cv.md, jak-napisac-cv.md; add a comparison table of example CVs by role |
| 2 | zawody-przyszlosci-2026.md | 51 | Near-duplicate of zawody-przyszlosci.md | Merge or differentiate against zawody-przyszlosci.md (see Cannibalization below) before further optimization |
| 3 | jaki-zawod-wybrac.md | 52 | No internal links; thin evidence | Link to sciezka-kariery.md, test-kariery-online.md, doradca-zawodowy.md |
| 4 | najlepiej-platne-zawody.md | 52 | No internal links; no sourced salary data flagged as evidence | Cite GUS/Wynagrodzenia.pl salary data with dates; link to zawody-przyszlosci.md |
| 5 | test-kompetencji-zawodowych.md | 52 | No internal links; overlaps test-kariery-online.md | Differentiate framing (competency test vs. career-path test) and cross-link both |
| 6 | umiejetnosci-do-cv.md | 52 | No internal links; thin evidence | Link to cv-wzor.md, profesjonalne-cv.md; add a skills-by-industry table |
| 7 | wzor-cv.md | 52 | No internal links; overlaps cv-wzor.md, przykladowe-cv.md | Resolve cannibalization first (Merge/Redirect), then link survivors |
| 8 | cv-studenta.md | 53 | No internal links | Link to praca-dla-studenta.md, cv-bez-doswiadczenia.md |
| 9 | doradca-zawodowy.md | 53 | No internal links; overlaps doradztwo-zawodowe.md | Differentiate (person/service vs. concept) and cross-link |
| 10 | doradztwo-zawodowe.md | 53 | No internal links; overlaps doradca-zawodowy.md | Same as above |

*(All 35 posts sit in a narrow 51–58 band — see the full Per-Post table above for the complete ranked list. After the template-level fixes in the Issue Frequency section are applied site-wide, re-run this audit; individual content-depth work will matter more once linking/schema/meta gaps are closed.)*

## Topic Cannibalization

| Keyword / Intent | Competing Posts | Recommendation |
|---|---|---|
| CV template / wzór CV | cv-wzor.md, wzor-cv.md, przykladowe-cv.md | **Merge**: cv-wzor.md and wzor-cv.md are near-identical intent (both "CV wzór 2026 - szablony"). Pick the stronger (cv-wzor.md, +1 external citation) as canonical, 301-redirect the other, preserve backlinks. Keep przykladowe-cv.md but **differentiate** as "example CVs by role/industry" rather than generic templates. |
| How to write a CV | cv.md, jak-napisac-cv.md, jak-zrobic-cv.md, profesjonalne-cv.md | **Differentiate**: cv.md (general overview/pillar), jak-napisac-cv.md and jak-zrobic-cv.md are near-duplicate "how-to" framing — **merge** these two into one step-by-step guide, redirect the weaker. Keep profesjonalne-cv.md distinct (formatting/professional appearance angle) and link it from the merged how-to guide. |
| CV builder / kreator CV | kreator-cv.md, darmowy-kreator-cv.md | **Differentiate**: kreator-cv.md as a broad tool-comparison piece, darmowy-kreator-cv.md as the free-tier-specific piece (it already covers this angle well). Cross-link both; make sure only one targets "kreator cv" as primary keyword. |
| Cover letter | list-motywacyjny.md, jak-napisac-list-motywacyjny.md, wzor-listu-motywacyjnego.md | **Differentiate** into a 3-post cluster: list-motywacyjny.md (pillar/overview), jak-napisac-list-motywacyjny.md (how-to), wzor-listu-motywacyjnego.md (templates) — this is a valid hub-and-spoke split, but currently zero internal links connect them. Add the cross-links; no merge needed. |
| Job search | szukanie-pracy.md, jak-znalezc-prace.md, gdzie-szukac-pracy.md | **Merge**: szukanie-pracy.md and jak-znalezc-prace.md cover essentially the same "how/where to search" intent. Merge into one strong post, redirect the weaker (jak-znalezc-prace.md, lower score). Keep gdzie-szukac-pracy.md as the "which portals/channels" spoke and link it in. |
| Career advisor / doradztwo zawodowe | doradca-zawodowy.md, doradztwo-zawodowe.md | **Differentiate**: doradca-zawodowy.md = "the person/role, cost, is it worth it"; doradztwo-zawodowe.md = "the service/concept, when to use it". Currently near-identical H1 framing — tighten each to its distinct angle and cross-link. |
| Future professions | zawody-przyszlosci.md, zawody-przyszlosci-2026.md | **Merge**: literally the same topic with a year variant in the slug. Pick the higher-scoring/more current one, 301-redirect the other, preserve backlinks and update internal links site-wide. |
| No experience (job vs. CV angle) | cv-bez-doswiadczenia.md, praca-bez-doswiadczenia.md | **Keep separate** (different intent: CV-writing vs. job-hunting for the same audience) but currently **not cross-linked** — add reciprocal internal links; this is the cluster's biggest quick win. |

## Orphan Pages

**All 35 published posts have zero inbound internal links** — there is currently no post-to-post linking anywhere in `frontend/features/blog/articles/`. This is a site-wide structural gap, not a per-post one. Rather than list 35 identical rows, treat this as one fix: implement the internal-linking module described in Site-Wide Issue Frequency, then re-run this audit to confirm orphan count drops to 0.

Suggested first cross-links to seed (by topical proximity, based on the cannibalization clusters above and category/tag overlap in frontmatter):

| Page | Recommended Link Sources |
|---|---|
| cv-bez-doswiadczenia.md | praca-bez-doswiadczenia.md, cv-studenta.md, jak-napisac-cv.md |
| praca-dla-studenta.md | cv-studenta.md, praca-bez-doswiadczenia.md, jak-znalezc-prace.md |
| sciezka-kariery.md | jaki-zawod-wybrac.md, test-kariery-online.md, doradca-zawodowy.md |
| wypalenie-zawodowe-co-dalej.md | sciezka-kariery.md, jak-zmienic-branze.md, doradca-zawodowy.md |
| pytania-na-rozmowie-kwalifikacyjnej.md | rozmowa-kwalifikacyjna.md, cv.md |

## Stale Content

No post is stale by a hard day-count (published April/March 2026, 5–6 months old at audit time), but **freshness signaling is absent everywhere**: 0/35 posts declare `lastUpdated` or `dateModified` in frontmatter, so neither readers nor crawlers can tell whether content has been revisited. Because the site targets "2026" year-stamped titles (e.g. "CV 2026", "Zawody przyszłości 2026"), these posts *will* read as stale to users once the calendar turns — build the refresh cadence in now.

| Priority | Trigger | Posts | Refresh Effort |
|---|---|---|---|
| Medium | Year-stamped titles ("2026" in H1/title) tied to salary/ranking data that changes annually | najlepiej-platne-zawody.md, zawody-przyszlosci.md / -2026.md | Light refresh: update salary figures/sources each year (1-2h) |
| Medium | Tool/portal recommendations that go stale as products change | kreator-cv.md, darmowy-kreator-cv.md, gdzie-szukac-pracy.md | Light refresh: verify tool/portal claims still accurate (1-2h) |
| Low | Evergreen how-to/advice content | cv.md, jak-napisac-cv.md, rozmowa-kwalifikacyjna.md, and most "Kariera"-category posts | Low priority; add `lastUpdated` when next touched |

Action: add a `lastUpdated` (or `dateModified`) frontmatter field site-wide, backfilled to each post's current `date`, and wire it into the JSON-LD schema fix above so `dateModified` is generated automatically rather than tracked by hand.

## AI Citation Readiness

Every post scores 6–9/15 on AI citation readiness (Rewrite-band). Two fixable, universal gaps:

- **No entity definitions** (`**term** is/are` pattern) on 35/35 posts — a low-effort, high-yield fix for LLM extractability. E.g. in cv.md, define `**CV**` (curriculum vitae) once near the top.
- **No JSON-LD / structured data** — covered above; also directly affects AI Overview and answer-engine citation eligibility, not just classic SEO.

Crawler-access checks (robots.txt, llms.txt, GPTBot/ClaudeBot/PerplexityBot/Google-Extended policy, SSR/SSG rendering, JS-gating) were **SKIPPED: no robots.txt/llms.txt found under `frontend/public`, and live-site crawl was out of scope for a local repo audit.** Recommend running `/blog geo` against the deployed site once these are in place — Next.js App Router content here is server-rendered by default, so JS-gating risk is low, but this should be confirmed against the live deploy.

## Technical Crawl and Search Performance

**SKIPPED**: no `robots.txt` or `sitemap.xml` found under `frontend/public`; no Search Console/GA4/PageSpeed credentials configured in this project (`blog-google` not set up). Canonical tags, redirects, hreflang, and HTTP status checks require a live URL and were not run. Recommend configuring `blog-google` and re-running Step 2.5 once the site is deployed, plus generating a sitemap covering the 35 `/blog/[category]/[slug]` routes.

---

## Summary

- **35 published posts, average score 54.7/100** — every single post lands in the "Needs Work" (50-69) band. None are broken; none are exceptional yet.
- **The real story is systemic, not per-post**: 100% missing schema, 100% missing OG tags, 97% zero internal links, 100% missing freshness dates, 100% missing original-evidence/entity-definition signals. Four to five template-level fixes will move all 35 posts at once.
- **8 cannibalization clusters** identified; 3 clear merge/redirect candidates (cv-wzor.md↔wzor-cv.md, jak-napisac-cv.md↔jak-zrobic-cv.md, zawody-przyszlosci.md↔-2026.md, szukanie-pracy.md↔jak-znalezc-prace.md) will reduce internal keyword competition once resolved.
- **3 unpublished drafts** exist (`_`-prefixed); the weakest, `_doradca-finansowy-kiedy-skorzystac.md` (score 40), is off-brand (personal finance advisory on a CV/career platform) — worth a content-strategy check before it's ever published.

**Recommended next steps:**
1. Ship the four template-level fixes (internal linking module, JSON-LD schema, OG/Twitter meta, `lastUpdated` field) — this is the highest-leverage work in this audit.
2. Resolve the 3 merge/redirect cannibalization pairs.
3. Run `/blog analyze frontend/features/blog/articles/zawody-przyszlosci-2026.md` (lowest-scoring published post, tied) for a single-post deep dive.
4. Run `/blog flow optimize` on the CV-cluster pillar posts (cv.md, cv-wzor.md) for AI-citation-specific SEO checks once schema/linking are in place.
5. Decide on `_doradca-finansowy-kiedy-skorzystac.md` before publishing — confirm it fits the Vocare brand (see [Vocare platform features](project_vocare_features.md) memory: CV/career-focused, not financial advisory).

Full machine-readable data: `reports/blog-audit-2026-09-02.json`
