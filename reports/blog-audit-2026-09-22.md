# Blog Audit Report - Vocare

**Audit date:** 2026-09-22  
**Scope:** `frontend/features/blog/articles/` (123 published `.md` posts + 3 `_`-prefixed drafts excluded from the build)  
**Site layer audited:** `frontend/app/blog/**`, `frontend/app/sitemap.ts`, `frontend/app/robots.ts`, `frontend/next.config.ts`  
**Language:** Polish (pl-PL). Readability scored with the analyzer's `fog_pl` model.  
**Analyzer:** `analyze_blog.py --batch --format json` (internal editorial readiness heuristic; not a calibrated probability, not an authorship classifier).

---

## Summary dashboard

| Metric | Count |
|--------|-------|
| Total published posts | 123 |
| Average score (adjusted) | **75.9 / 100** |
| Average score (raw analyzer) | 69.9 / 100 |
| Posts scoring 90+ (Excellent) | 0 |
| Posts scoring 80-89 (Good) | 10 |
| Posts scoring 70-79 (Needs work) | 111 |
| Posts scoring 60-69 (Poor) | 2 |
| Posts scoring <60 | 0 |
| Orphan pages (0 inbound internal links) | **0** |
| Dead-end pages (0 outbound internal links) | **0** |
| Broken internal links | **0** |
| Posts with zero external citations | **49** |
| Posts carrying unsourced statistics | **42** |
| Stale content (>180 days) | **0** |
| Cannibalization clusters needing action | 4 |
| Site-wide technical defects found | 6 |

### The one-paragraph read

This blog is **structurally healthy and editorially thin**. The information architecture is genuinely good - zero orphans, zero dead ends, zero broken internal links, a clean 301 redirect map from the 2026-09-02 cannibalization cleanup, and correct BlogPosting + BreadcrumbList JSON-LD on every post. Nothing here is broken in a way that costs indexation. What holds the corpus at ~76/100 instead of ~88 is the same three things on nearly every post: **no sources** (40% cite nothing external, 85% of all statistics are unsourced), **no depth** (median 641 words against competitors running 2,000+), and **no original evidence** (73 posts flagged for zero differentiated analysis). Those are content problems, not engineering problems. There are also six concrete code-level defects listed below that are each a sub-hour fix.

---

## Progress since the 2026-09-02 audit

The previous audit (`reports/blog-audit-2026-09-02.md`) covered 35 posts. Nearly every structural finding it raised has been
closed, and the corpus has grown 3.5x while the average score rose 15.6 points on the same raw analyzer scale.

| Metric | 2026-09-02 | 2026-09-22 | Change |
|--------|-----------|-----------|--------|
| Published posts | 35 | 123 | +88 |
| Average score (raw analyzer) | 54.3 | 69.9 | **+15.6** |
| Posts scoring 70+ (raw) | 0 | 72 | +72 |
| Posts scoring <50 | 0 | 0 | - |
| Orphan pages | **35 (all)** | **0** | fixed |
| Dead-end pages | **35 (all)** | **0** | fixed |
| Posts with JSON-LD schema | 0 | **123 (all)** | fixed |
| Posts with OG tags | 0 | **123 (all)** | fixed |
| Posts with `updatedAt` | 0 | 53 | partial |
| "No internal links" issue | 35 posts | **0 posts** | fixed |
| "Reader utility is limited" issue | 35 posts | **1 post** | fixed |
| "No entity definitions" issue | 35 posts | 23 posts | improved |
| "No differentiated evidence" issue | 35 posts | 73 posts | **unresolved and scaled** |

Three things to take from this:

1. **The internal linking and schema work landed completely.** Every post that existed in September was an orphan and a dead
   end with no structured data. Today none are. That is the single biggest quality jump in the dataset.
2. **`updatedAt` adoption stalled at 43%.** It went from 0 to 53 posts, but 70 posts still lack it - and the sitemap does not
   read it even where it exists (defect #2).
3. **The originality gap was never addressed and has scaled with the corpus.** It affected 35 of 35 posts then and 73 of 123
   now. Every other September finding was fixed by a systemic change; this one cannot be, because it needs per-post editorial
   work. It is now the largest remaining constraint on the blog's score.

## Scoring correction: the analyzer under-reports every post by 6 points

The batch analyzer reads markdown files in isolation. It reported `schema: 0/4` and `social_meta: 0/2` for **all 123 posts** and raised *"No JSON-LD schema markup detected"* 123 times. **This is a false negative.** Schema and social meta are emitted by the Next.js route, not the markdown:

- `frontend/app/blog/[category]/[slug]/page.tsx` emits `BlogPosting` (+2), `Person` (+1, `author` is set on all posts), and `BreadcrumbList`/`Organization` (+1) -> **schema 4/4**
- The same file's `generateMetadata` emits `og:type=article`, `og:title`, `og:description`, `og:image`, and `twitter:card=summary_large_image` -> **social_meta 2/2**

Every score in this report is the analyzer total **+6**. Raw analyzer average 69.9 -> **adjusted 75.9**. Ignore the 123 "missing schema" issues in the JSON export.

---

## Category averages (adjusted, n=123)

| Category | Avg | Max | Verdict |
|----------|-----|-----|---------|
| SEO optimization | 24.2 | 25 | Strong - titles, headings, keyword placement, internal linking all near ceiling |
| Content quality | 20.8 | 30 | Weak - depth and originality are the drag |
| AI citation readiness | 11.5 | 15 | Good - TL;DR + FAQ on nearly every post |
| Technical elements | 11.8 | 15 | Good once schema/OG are credited |
| **E-E-A-T signals** | **7.7** | **15** | **Worst category - this is the bottleneck** |

Sub-score detail on the two weak categories:

| Sub-score | Avg | Max | Note |
|-----------|-----|-----|------|
| `eeat.trust` | **0.16** | 1 | 105 of 123 posts score zero |
| `eeat.citations` | **1.48** | 4 | Direct consequence of 0.68 external citations/post |
| `eeat.experience` | 2.03 | 3 | Flat across the corpus |
| `eeat.author` | 4.00 | 4 | At ceiling - but see the `author: Vocare` finding below |
| `content.originality` | **1.19** | 3 | 73 posts flagged "no differentiated evidence" |
| `content.depth` | 6.49 | 7 | Scores well *relative to length*; the length itself is the problem |
| `content.engagement` | 2.55 | 4 | No inline images anywhere |
| `ai.entity_clarity` | 1.64 | 3 | 23 posts define no entities |

---

## Site-wide technical defects

Six defects found in the blog's code layer. All are verified against source, and all are small fixes.

### 1. Duplicate `<h1>` on 121 of 123 post pages - HIGH

`frontend/app/blog/[category]/[slug]/page.tsx:141` renders `<h1>{metadata.title}</h1>`, and `MarkdownComponents.tsx:27-28` maps markdown `#` to a real `<h1>`. 121 posts open their body with a `# ` heading, so those pages ship **two `<h1>` elements with different wording**.

Example - `doradztwo-zawodowe.md`:

- Route `<h1>`: "Doradztwo zawodowe 2026 - czym jest i kiedy skorzystac" (the frontmatter `title`)
- Markdown `<h1>`: "Doradztwo zawodowe 2026 - kiedy naprawde warto skorzystac"

**Fix (one line, fixes all 121):** in the `components` map, change `h1: H1` to `h1: H2` - or strip the leading `# ` line from every article. Mapping to `H2` is the safer change; it preserves the visual hierarchy and demotes the duplicate.

### 2. `sitemap.ts` reports the wrong `lastmod` for 53 posts - HIGH

`frontend/app/sitemap.ts:47` sets `lastModified: article.date` (the **publish** date), but the JSON-LD on the same posts sets `dateModified: metadata.updatedAt ?? metadata.date`. 53 posts carry `updatedAt: 2026-09-*`. Google therefore sees a sitemap `lastmod` that is months older than the page's own `dateModified` - a freshness-parity break that suppresses recrawl of exactly the posts that were just refreshed.

**Fix:** `lastModified: article.updatedAt ?? article.date`.

### 3. `/blog/<category>` returns 404 - MEDIUM

`frontend/app/blog/[category]/` contains only the `[slug]/` subfolder - there is no `page.tsx`. So `/blog/CV`, `/blog/Job`, `/blog/Kariera` and `/blog/rynek-pracy` are all 404s, even though they are real path segments in 123 canonical URLs and in the BreadcrumbList. Crawlers walking the URL hierarchy hit a wall at the middle segment, and there is no category hub to distribute authority to the 24-38 posts beneath it.

**Fix:** add `app/blog/[category]/page.tsx` listing that category's posts. This is also the single highest-leverage internal linking change available - it creates four topical hubs where there are currently none.

### 4. Category slugs are inconsistent in case and language - MEDIUM

| Category | Posts | URL segment |
|----------|-------|-------------|
| `CV` | 34 | `/blog/CV/...` |
| `Job` | 38 | `/blog/Job/...` |
| `Kariera` | 27 | `/blog/Kariera/...` |
| `rynek-pracy` | 24 | `/blog/rynek-pracy/...` |

Three casing conventions (`CV` upper, `Job`/`Kariera` title, `rynek-pracy` lower-kebab) and two languages (`Job` is English on an otherwise Polish site). URL paths are case-sensitive, so `/blog/cv/...` and `/blog/CV/...` are distinct URLs - any lowercase inbound link 404s. **Fix:** normalize to lowercase kebab Polish (`cv`, `praca`, `kariera`, `rynek-pracy`) and add 301s from the old forms, following the pattern already established in `next.config.ts`.

### 5. `estimatedReadTime` is wrong on 110 of 123 posts - MEDIUM

Claimed read times cluster at 7/8/9 minutes (hand-set boilerplate: 47 posts say 7, 49 say 8, 16 say 9). Actual body length is 760 words on average - roughly **4 minutes**. 110 posts overstate by more than 2 minutes; **not one understates**. This number is shown on every article card and every post page.

Worst cases:

| Post | Claimed | Actual | Words |
|------|---------|--------|-------|
| `mobbing-w-pracy` | 9 min | 3.4 min | 607 |
| `linkedin-profil` | 9 min | 3.7 min | 668 |
| `cv-freelancera` | 8 min | 2.8 min | 507 |
| `zarzadzanie-czasem` | 8 min | 3.0 min | 536 |
| `feedback-w-pracy` | 8 min | 3.0 min | 532 |

**Fix:** compute it in `getArticlesMetadata` from the body word count instead of trusting frontmatter. Note that fixing the number alone makes the thinness visible to readers - pair it with the depth work below.

### 6. 19 posts share one OG image; 34 covers serve 123 posts - MEDIUM

`coverImage` is reused heavily, and it is also the `og:image` and the schema `image`. The social preview for 19 different posts is byte-identical.

| Cover | Posts using it |
|-------|----------------|
| `/images/blog/job-search.webp` | 19 |
| `/images/blog/future-work.webp` | 10 |
| `/images/blog/cv-template.webp` | 9 |
| `/images/blog/future-careers.webp` | 8 |
| `/images/blog/career-counseling.webp` | 8 |
| `/images/blog/career-advisor.webp` | 8 |
| `/images/blog/best-paid-jobs.webp` | 7 |
| `/images/blog/job-portals.webp` | 5 |

**Fix:** the top 8 reused covers account for 74 posts. Generating distinct covers for just the 20 highest-traffic posts removes most of the duplication.

### Also noted (not defects, but worth a decision)

- **No `llms.txt`.** `robots.ts` allows all user agents with only `/api/` disallowed, so GPTBot, ClaudeBot, PerplexityBot and Google-Extended are all permitted by default. That is a valid posture; an `llms.txt` would add explicit guidance but is optional.
- **`app/blog/README.md` documents the wrong path.** It says articles live in `frontend/articles/`; they live in `frontend/features/blog/articles/` (`constants.ts:1`).
- **The documented inline-image syntax is used by zero posts.** The README specifies `![Alt](/img.webp 'width=800 height=450')` and `getImageSizeFromTitle` implements it, but **0 of 123 posts contain a single inline image.** Every post is a wall of text under one cover photo.
- **Titles run long once the site template is applied.** `app/layout.tsx:92-95` appends `" | Vocare"` (+9 chars). 45 posts have frontmatter titles of 61+ chars, so their rendered `<title>` exceeds 70 chars and will truncate in SERPs. `executive-search-headhunting` renders at 89 chars.
- **15 meta descriptions exceed 165 chars** and will truncate; longest is `executive-search-headhunting` at 180.

---

## E-E-A-T: the single biggest problem

This is where the corpus loses the most points, and it is one finding with three faces.

### 40% of posts cite nothing at all

**49 of 123 posts have zero external citations.** Corpus-wide the average is **0.68 external links per post**, median 1, maximum 3. 61 distinct external domains across the entire blog.

| External citations | Posts |
|--------------------|-------|
| 0 | 49 |
| 1 | 67 |
| 2 | 4 |
| 3 | 3 |

The uncited set includes the posts where sourcing matters most: **`rynek-pracy-w-polsce`** (the most-linked post on the blog, 23 inbound links, an article about the Polish labour market, with no data source), plus `rynek-pracy-budownictwo`, `rynek-pracy-edukacja`, `rynek-pracy-energetyka`, `rynek-pracy-hr`, `rynek-pracy-marketing`, `rynek-pracy-medycyna`, `rynek-pracy-prawo`, `rynek-pracy-sprzedaz`, `negocjacje-wynagrodzenia`, `najlepiej-platne-zawody`.

### 85% of statistics are unsourced

**170 statistics across the corpus; 25 are sourced.** 42 posts carry at least one unsourced number.

The worst offenders are legal/compliance topics, where an unsourced figure is not just an SEO weakness but a liability - these are articles about statutory entitlements and allowances:

| Post | Statistics | Sourced | Topic |
|------|-----------|---------|-------|
| `delegacja-sluzbowa` | 14 | 0 | Business travel allowances (statutory rates) |
| `urlop-macierzynski-rodzicielski` | 13 | 0 | Maternity/parental leave entitlements |
| `jak-znalezc-prace` | 10 | 0 | Job search |
| `przykladowe-cv` | 10 | 0 | CV examples |
| `umowa-o-dzielo` | 7 | 0 | Contract law / taxation |
| `jak-napisac-list-motywacyjny` | 6 | 0 | Cover letters |
| `list-motywacyjny` | 6 | 0 | Cover letters |
| `cv-managera` | 5 | 0 | CV |
| `praca-w-niedziele-i-swieta` | 4 | 0 | Sunday/holiday work law |
| `zwolnienie-lekarskie-l4` | 3 | 0 | Sick leave law |

`isap.sejm.gov.pl` (4 links), `lexlege.pl` (5) and `zus.pl` (1) are already used elsewhere in the blog - the sourcing pattern exists, it just is not applied consistently.

### `author: Vocare` is typed as a `Person`

Every post sets `author: Vocare` and `page.tsx:100-106` emits it as `{"@type": "Person", "name": "Vocare", "url": "/blog"}`. A company is not a Person, and `/blog` is not an author page. The analyzer gives `eeat.author` a full 4/4 because the field is populated, but for E-E-A-T purposes this is an empty signal: no named human, no credentials, no author bio, no author page. Meanwhile `eeat.trust` averages **0.16/1** with 105 posts at zero.

**Fix:** attribute posts to named humans with credentials (`Person` + `jobTitle` + `sameAs` -> LinkedIn), add author pages at `/blog/autor/<slug>`, and keep `Vocare` as the `publisher` Organization it already is.

### Every CTA uses identical anchor text

**286 links to the `vocare.pl` homepage, all with the anchor text "Vocare.pl"** - 100% exact-match repetition, ~2.3 per post. Two consequences: it is an unnatural link pattern, and it inflates the analyzer's `external_count` (which is why some posts appear to have 8 "external links" while having 1 real citation). These are also absolute URLs where relative paths would be correct for same-site links.

---

## Content depth

| Metric | Value |
|--------|-------|
| Median body length | **641 words** |
| Mean body length | 760 words |
| Shortest | 467 words |
| Longest | 1,840 words |
| Posts under 900 words | **90 of 123 (73%)** |
| Posts with inline images | **0 of 123** |
| Posts with at least one table | 94 of 123 |
| Posts with a TL;DR | 121 of 123 |
| Posts with an FAQ section | 123 of 123 |
| H2 headings per post | 7.0 avg (6-12) |

For head terms like *cv wzor*, *list motywacyjny* and *rozmowa kwalifikacyjna*, Polish SERP leaders routinely run 2,000-3,000 words with downloadable templates. A 641-word median is not competitive on those queries regardless of how clean the on-page SEO is - and the on-page SEO here is genuinely clean (24.0/25 average).

The structural work is already done well: TL;DR on 121/123 and FAQ on 123/123 is a strong AI-citation base, and heading differentiation is good (only `Podsumowanie` and `Powiazane artykuly` repeat across posts). What is missing is substance inside that structure.

---

## Topic cannibalization

A cannibalization cleanup already ran on **2026-09-02** - `next.config.ts:38-62` holds four verified 301s (`wzor-cv`->`cv-wzor`, `jak-napisac-cv`->`jak-zrobic-cv`, `zawody-przyszlosci`->`zawody-przyszlosci-2026`, `szukanie-pracy`->`jak-znalezc-prace`). All four targets exist and their frontmatter categories match the redirect paths. Good hygiene. What remains:

| Cluster | Competing posts | Score | Words | Recommendation |
|---------|----------------|-------|-------|----------------|
| **CV core** | `cv`, `cv-do-pracy`, `cv-wzor`, `jak-zrobic-cv`, `przykladowe-cv`, `profesjonalne-cv` | 74-78 | 962-1,351 | **Differentiate + consolidate.** Six posts on near-synonymous Polish queries. `cv` and `jak-zrobic-cv` overlap most; `profesjonalne-cv` (969 w) is the weakest and has no distinct intent - merge it into `cv`. Keep `cv-wzor` and `przykladowe-cv` as template/example pages and make them genuinely template-led. |
| **List motywacyjny** | `list-motywacyjny`, `jak-napisac-list-motywacyjny`, `wzor-listu-motywacyjnego` | 73-79 | 1,082-1,162 | **Differentiate.** Titles are already distinct (is-it-needed / how-to / templates). Enforce it in the body: `list-motywacyjny` should not re-teach how to write one. |
| **Doradztwo zawodowe** | `doradca-zawodowy` (78), `doradztwo-zawodowe` (84) | 78-84 | 1,122 / 1,120 | **Merge or hard-differentiate.** Highest full-text similarity on the blog (0.52 Jaccard). Near-identical length, overlapping H2s, both answer "what is it / what does it cost / is it worth it". `doradztwo-zawodowe` is the stronger post - redirect `doradca-zawodowy` into it, or rewrite it as a pure "how to choose an advisor" page. |
| **Portfolio** | `portfolio-zawodowe` (72), `portfolio-career` (71) | 71-72 | 665 / 660 | **Differentiate urgently.** Both thin, both weak, and `portfolio-career` is an English term on a Polish site targeting a different concept (multi-project careers) that the title does not make clear. |

**Not cannibalization:** the 24 `rynek-pracy-*` industry posts share a title template (*"Rynek pracy <branza> 2026 - trendy, zarobki"*) and therefore show high title-token overlap, but each targets a distinct industry keyword. They are differentiated by design. Their real problem is different: **all 24 are thin and 10 of them cite nothing**, on a topic that is entirely statistics-driven. Treat them as a sourcing project, not a merge project.

---

## Link graph

The healthiest part of the audit.

| Metric | Value |
|--------|-------|
| Orphan pages | **0** |
| Dead-end pages | **0** |
| Broken internal links | **0** |
| Category/slug mismatches in links | **0** |
| Links to unpublished drafts | **0** |
| Avg inbound links per post | 4.25 |
| Avg outbound links per post | 4.25 |
| Minimum outbound | 3 |

Every post also receives one inbound link from `/blog`, which renders all 123 cards server-side - `SearchView` is a client component but its initial render (empty search) includes every article, so the links are in the prerendered HTML and are crawlable. There is no JS gating.

**Most-linked posts (de facto hubs):**

| Post | Inbound |
|------|---------|
| `rynek-pracy-w-polsce` | 23 |
| `sciezka-kariery` | 18 |
| `najlepiej-platne-zawody` | 11 |
| `wypalenie-zawodowe-co-dalej` | 11 |
| `negocjacje-wynagrodzenia` | 11 |
| `jak-zmienic-branze` | 10 |
| `cv-wzor` | 10 |
| `doradca-zawodowy` | 10 |

**Thinnest inbound (1 link each - not orphans, but under-supported):** `cv-do-pracy`, `darmowy-kreator-cv`, `doradztwo-zawodowe`, `cv-nauczyciela`, `cv-prawnika`, `urlop-ojcowski`, `zainteresowania-w-cv`.

Two of those deserve attention: **`darmowy-kreator-cv`** is a commercial-intent page (the CV builder funnel) with a single inbound link, and **`doradztwo-zawodowe`** is the **highest-scoring post on the blog (84)** with a single inbound link. Both are under-linked relative to their value.

---

## Freshness

**No stale content.** All 123 posts are dated 2026, median effective age 20 days, maximum 130 days. Nothing is over six months old.

| Age bucket | Posts |
|------------|-------|
| <=90 days | 113 |
| 91-180 days | 10 |
| 181-365 days | 0 |
| >365 days | 0 |

The freshness *problem* is metadata, not content: **70 of 123 posts have no `updatedAt` field**, and of the 53 that do (all `2026-09`), the sitemap reports their publish date instead (defect #2). The 10 oldest posts - `assessment-center` (130d), `awans-zawodowy` (127d), `cv-managera` (125d), `executive-search-headhunting` (120d), `mentoring-zawodowy` (111d), `portfolio-career` (103d), `portfolio-zawodowe` (102d), `powrot-do-pracy-po-macierzynskim` (99d), `praca-zdalna` (96d), `referencje-zawodowe` (92d) - are also, not coincidentally, among the lowest-scoring. They predate the September quality pass.

---

## Prioritized action queue

Ordered by impact per hour of work, not by score.

| # | Action | Scope | Effort | Why |
|---|--------|-------|--------|-----|
| 1 | Fix duplicate `<h1>` (`h1: H1` -> `h1: H2`) | 121 posts | 5 min | One-line change, fixes every post |
| 2 | Fix sitemap `lastModified` -> `updatedAt ?? date` | 53 posts | 5 min | One-line change, unblocks recrawl of refreshed posts |
| 3 | Source the 10 legal/compliance posts carrying unsourced statutory figures | 10 posts | 4-6 h | Liability, not just SEO. Start with `delegacja-sluzbowa` (14 unsourced) and `urlop-macierzynski-rodzicielski` (13) |
| 4 | Add `app/blog/[category]/page.tsx` | Site-wide | 2-3 h | Removes 4 x 404, creates 4 topical hubs, biggest available internal-linking gain |
| 5 | Source the 24 `rynek-pracy-*` posts (GUS, Barometr Zawodow, NBP) | 24 posts | 8-12 h | Largest uncited block; statistics-driven topic with no statistics cited |
| 6 | Compute `estimatedReadTime` from word count | 123 posts | 30 min | 110 posts currently overstate it to the reader |
| 7 | Replace `author: Vocare` with named human authors + author pages | Site-wide | 4-6 h | `eeat.trust` is 0.16/1; this is the ceiling on the whole category |
| 8 | Expand the 10 thinnest/lowest-scoring posts past 1,200 words | 10 posts | 10-15 h | See rewrite queue below |
| 9 | Resolve the `doradca-zawodowy` / `doradztwo-zawodowe` overlap | 2 posts | 2 h | Clearest cannibalization case remaining |
| 10 | Normalize category slugs to lowercase Polish + 301s | Site-wide | 2 h | URL hygiene; do it before the corpus grows further |
| 11 | Add inline images (README syntax already supports it) | 123 posts | ongoing | Currently zero across the entire blog |
| 12 | Diversify OG covers for the top 20 posts | 20 posts | 3 h | 19 posts currently share one social preview |

### Lowest-scoring posts (rewrite queue)

| # | Post | Score | Words | Ext. cites | In | Out | Top issue |
|---|------|-------|-------|-----------|----|----|-----------|
| 1 | `rynek-pracy-logistyka` | 68 | 561 | 1 | 3 | 5 | Thin (<900 w) |
| 2 | `rynek-pracy-hr` | 69 | 559 | 0 | 2 | 4 | No external citations |
| 3 | `cv-po-angielsku` | 70 | 742 | 0 | 7 | 8 | No external citations |
| 4 | `rynek-pracy-budownictwo` | 70 | 581 | 0 | 4 | 6 | No external citations |
| 5 | `rynek-pracy-edukacja` | 70 | 621 | 0 | 4 | 6 | No external citations |
| 6 | `rynek-pracy-marketing` | 70 | 644 | 0 | 4 | 7 | No external citations |
| 7 | `awans-zawodowy` | 71 | 664 | 0 | 6 | 5 | No external citations |
| 8 | `linkedin-profil` | 71 | 668 | 0 | 5 | 6 | No external citations |
| 9 | `portfolio-career` | 71 | 660 | 0 | 2 | 4 | No external citations |
| 10 | `praca-zdalna-dla-zagranicznego-pracodawcy` | 71 | 942 | 0 | 4 | 4 | No external citations |
| 11 | `rynek-pracy-energetyka` | 71 | 598 | 0 | 3 | 5 | No external citations |
| 12 | `rynek-pracy-medycyna` | 71 | 595 | 0 | 4 | 6 | No external citations |
| 13 | `rynek-pracy-produkcja` | 71 | 599 | 1 | 3 | 6 | Thin (<900 w) |
| 14 | `rynek-pracy-w-polsce` | 71 | 1604 | 0 | 23 | 25 | No external citations |
| 15 | `umowa-o-prace-vs-b2b` | 71 | 748 | 0 | 7 | 9 | No external citations |
| 16 | `assessment-center` | 72 | 622 | 0 | 2 | 3 | No external citations |
| 17 | `cv-managera` | 72 | 601 | 0 | 2 | 3 | No external citations |
| 18 | `executive-search-headhunting` | 72 | 641 | 0 | 2 | 3 | No external citations |
| 19 | `mba-czy-certyfikaty` | 72 | 664 | 3 | 2 | 3 | Thin (<900 w) |
| 20 | `portfolio-zawodowe` | 72 | 665 | 0 | 8 | 6 | No external citations |

---

## Per-post scores (all 123, ascending)

Scores are analyzer totals **+6** (schema/OG correction). Category columns: Content /30, SEO /25, E-E-A-T /15, Technical /15 (corrected), AI /15. "Ext" excludes the 286 `vocare.pl` homepage CTAs.

| Post | Score | Content | SEO | E-E-A-T | Tech | AI | Words | Ext | In | Out | Updated |
|------|-------|---------|-----|---------|------|----|-------|-----|----|----|---------|
| `rynek-pracy-logistyka` | 68 | 17 | 24 | 7 | 11 | 9 | 561 | 1 | 3 | 5 | 2026-09-09 |
| `rynek-pracy-hr` | 69 | 17 | 24 | 7 | 11 | 10 | 559 | 0 | 2 | 4 | 2026-09-09 |
| `cv-po-angielsku` | 70 | 17 | 24 | 7 | 12 | 10 | 742 | 0 | 7 | 8 | 2026-09-09 |
| `rynek-pracy-budownictwo` | 70 | 17 | 24 | 7 | 12 | 10 | 581 | 0 | 4 | 6 | 2026-09-09 |
| `rynek-pracy-edukacja` | 70 | 17 | 24 | 7 | 12 | 10 | 621 | 0 | 4 | 6 | 2026-09-09 |
| `rynek-pracy-marketing` | 70 | 17 | 24 | 7 | 12 | 10 | 644 | 0 | 4 | 7 | 2026-09-09 |
| `awans-zawodowy` | 71 | 19 | 24 | 7 | 12 | 9 | 664 | 0 | 6 | 5 | - |
| `linkedin-profil` | 71 | 17 | 24 | 7 | 12 | 11 | 668 | 0 | 5 | 6 | 2026-09-09 |
| `portfolio-career` | 71 | 17 | 24 | 7 | 12 | 11 | 660 | 0 | 2 | 4 | - |
| `praca-zdalna-dla-zagranicznego-pracodawcy` | 71 | 17 | 24 | 7 | 11 | 12 | 942 | 0 | 4 | 4 | - |
| `rynek-pracy-energetyka` | 71 | 18 | 24 | 7 | 12 | 10 | 598 | 0 | 3 | 5 | 2026-09-09 |
| `rynek-pracy-medycyna` | 71 | 17 | 24 | 7 | 12 | 11 | 595 | 0 | 4 | 6 | 2026-09-09 |
| `rynek-pracy-produkcja` | 71 | 17 | 24 | 8 | 12 | 10 | 599 | 1 | 3 | 6 | 2026-09-09 |
| `rynek-pracy-w-polsce` | 71 | 17 | 22 | 7 | 12 | 13 | 1604 | 0 | 23 | 25 | - |
| `umowa-o-prace-vs-b2b` | 71 | 19 | 24 | 7 | 12 | 9 | 748 | 0 | 7 | 9 | 2026-09-09 |
| `assessment-center` | 72 | 19 | 24 | 7 | 11 | 11 | 622 | 0 | 2 | 3 | - |
| `cv-managera` | 72 | 19 | 24 | 7 | 12 | 10 | 601 | 0 | 2 | 3 | - |
| `executive-search-headhunting` | 72 | 19 | 24 | 8 | 12 | 9 | 641 | 0 | 2 | 3 | - |
| `mba-czy-certyfikaty` | 72 | 17 | 24 | 9 | 12 | 10 | 664 | 3 | 2 | 3 | 2026-09-09 |
| `portfolio-zawodowe` | 72 | 17 | 24 | 7 | 12 | 12 | 665 | 0 | 8 | 6 | - |
| `referencje-zawodowe` | 72 | 17 | 24 | 7 | 12 | 12 | 605 | 0 | 3 | 3 | - |
| `rynek-pracy-prawo` | 72 | 17 | 24 | 7 | 12 | 12 | 577 | 0 | 3 | 5 | 2026-09-09 |
| `rynek-pracy-sprzedaz` | 72 | 19 | 24 | 8 | 11 | 10 | 580 | 0 | 5 | 6 | 2026-09-09 |
| `networking-zawodowy` | 73 | 19 | 24 | 8 | 12 | 10 | 652 | 0 | 6 | 5 | 2026-09-09 |
| `powrot-do-pracy-po-macierzynskim` | 73 | 17 | 24 | 8 | 12 | 12 | 653 | 0 | 6 | 6 | - |
| `wzor-listu-motywacyjnego` | 73 | 19 | 24 | 7 | 11 | 12 | 1134 | 0 | 2 | 3 | 2026-09-02 |
| `cv-po-niemiecku` | 74 | 19 | 24 | 7 | 12 | 12 | 581 | 1 | 4 | 5 | - |
| `jak-znalezc-prace` | 74 | 19 | 24 | 8 | 11 | 12 | 1267 | 0 | 9 | 5 | 2026-09-09 |
| `kariera-po-40-50` | 74 | 17 | 25 | 9 | 12 | 11 | 668 | 1 | 3 | 4 | 2026-09-09 |
| `kreator-cv` | 74 | 19 | 24 | 8 | 11 | 12 | 1065 | 0 | 3 | 4 | 2026-09-02 |
| `negocjacje-wynagrodzenia` | 74 | 19 | 24 | 7 | 12 | 12 | 789 | 0 | 11 | 6 | 2026-09-09 |
| `praca-hybrydowa` | 74 | 19 | 24 | 7 | 12 | 12 | 599 | 0 | 4 | 6 | 2026-09-09 |
| `praca-zdalna` | 74 | 19 | 24 | 7 | 12 | 12 | 633 | 0 | 4 | 4 | - |
| `profesjonalne-cv` | 74 | 19 | 24 | 8 | 11 | 12 | 969 | 1 | 9 | 5 | 2026-09-02 |
| `rynek-pracy-finanse` | 74 | 19 | 24 | 9 | 12 | 10 | 665 | 3 | 4 | 7 | 2026-09-09 |
| `rynek-pracy-it` | 74 | 19 | 24 | 7 | 12 | 12 | 785 | 1 | 8 | 6 | 2026-09-09 |
| `sciezka-kariery` | 74 | 19 | 24 | 7 | 11 | 13 | 1208 | 0 | 18 | 6 | 2026-09-09 |
| `test-kompetencji-zawodowych` | 74 | 19 | 24 | 7 | 11 | 13 | 1137 | 1 | 2 | 3 | 2026-09-02 |
| `umiejetnosci-do-cv` | 74 | 19 | 24 | 7 | 12 | 12 | 1105 | 0 | 9 | 5 | 2026-09-02 |
| `zainteresowania-w-cv` | 74 | 19 | 24 | 7 | 11 | 13 | 934 | 0 | 1 | 3 | 2026-09-02 |
| `cv-wideo` | 75 | 21 | 24 | 7 | 12 | 11 | 467 | 1 | 2 | 3 | - |
| `jak-zmienic-branze` | 75 | 21 | 24 | 7 | 11 | 12 | 1290 | 0 | 10 | 5 | 2026-09-02 |
| `jak-zrezygnowac-z-pracy` | 75 | 19 | 25 | 9 | 12 | 10 | 653 | 1 | 6 | 4 | 2026-09-09 |
| `mentoring-zawodowy` | 75 | 19 | 24 | 8 | 12 | 12 | 648 | 0 | 4 | 4 | - |
| `najlepiej-platne-zawody` | 75 | 19 | 24 | 8 | 11 | 13 | 1100 | 1 | 11 | 4 | 2026-09-09 |
| `onboarding-nowa-praca` | 75 | 19 | 24 | 8 | 12 | 12 | 662 | 0 | 3 | 5 | 2026-09-09 |
| `przykladowe-cv` | 75 | 21 | 23 | 7 | 12 | 12 | 1351 | 0 | 2 | 3 | 2026-09-02 |
| `rynek-pracy-gastronomia` | 75 | 19 | 24 | 8 | 12 | 12 | 529 | 2 | 3 | 4 | - |
| `umowa-na-czas-okreslony-limit` | 75 | 19 | 25 | 9 | 12 | 10 | 715 | 1 | 3 | 5 | - |
| `zawody-przyszlosci-2026` | 75 | 17 | 25 | 11 | 12 | 10 | 1492 | 3 | 8 | 4 | 2026-09-09 |
| `zwolnienie-lekarskie-l4` | 75 | 17 | 25 | 9 | 12 | 12 | 650 | 2 | 4 | 4 | - |
| `cv` | 76 | 23 | 23 | 7 | 11 | 12 | 1210 | 0 | 7 | 3 | 2026-09-02 |
| `cv-analityka-danych` | 76 | 22 | 24 | 7 | 12 | 11 | 547 | 1 | 2 | 3 | - |
| `cv-bez-doswiadczenia` | 76 | 22 | 24 | 7 | 11 | 12 | 984 | 0 | 3 | 3 | 2026-09-02 |
| `cv-freelancera` | 76 | 21 | 24 | 7 | 12 | 12 | 507 | 1 | 3 | 4 | - |
| `cv-wzor` | 76 | 21 | 24 | 7 | 12 | 12 | 1169 | 0 | 10 | 4 | 2026-09-02 |
| `gdzie-szukac-pracy` | 76 | 21 | 24 | 8 | 11 | 12 | 1087 | 0 | 5 | 4 | 2026-09-09 |
| `inteligencja-emocjonalna-w-pracy` | 76 | 22 | 24 | 7 | 12 | 11 | 598 | 1 | 2 | 3 | - |
| `jak-zrobic-cv` | 76 | 21 | 24 | 8 | 11 | 12 | 1232 | 0 | 9 | 3 | 2026-09-02 |
| `kontrola-trzezwosci-w-pracy` | 76 | 22 | 24 | 7 | 12 | 11 | 583 | 1 | 4 | 4 | - |
| `praca-bez-doswiadczenia` | 76 | 21 | 24 | 8 | 11 | 12 | 1115 | 0 | 3 | 3 | 2026-09-02 |
| `praca-dla-osob-niepelnosprawnych` | 76 | 22 | 24 | 7 | 12 | 11 | 644 | 1 | 2 | 3 | - |
| `prokrastynacja-w-pracy` | 76 | 22 | 24 | 7 | 12 | 11 | 597 | 1 | 3 | 3 | - |
| `rynek-pracy-handel-detaliczny` | 76 | 19 | 24 | 8 | 12 | 13 | 505 | 1 | 4 | 4 | - |
| `syndrom-oszusta` | 76 | 22 | 24 | 7 | 12 | 11 | 607 | 1 | 3 | 4 | - |
| `wypowiedzenie-zmieniajace` | 76 | 22 | 24 | 7 | 12 | 11 | 558 | 1 | 2 | 3 | - |
| `zdjecie-do-cv` | 76 | 21 | 24 | 8 | 12 | 11 | 516 | 1 | 2 | 3 | - |
| `badania-lekarskie-do-pracy` | 77 | 22 | 24 | 7 | 12 | 12 | 608 | 1 | 4 | 5 | - |
| `budowanie-marki-osobistej` | 77 | 22 | 24 | 7 | 12 | 12 | 580 | 1 | 2 | 3 | - |
| `cv-nauczyciela` | 77 | 22 | 24 | 7 | 12 | 12 | 584 | 1 | 1 | 3 | - |
| `czas-pracy-elastyczny` | 77 | 24 | 24 | 7 | 12 | 10 | 612 | 1 | 2 | 3 | - |
| `jak-napisac-list-motywacyjny` | 77 | 23 | 24 | 7 | 11 | 12 | 1162 | 0 | 2 | 3 | 2026-09-02 |
| `nadgodziny-wynagrodzenie` | 77 | 22 | 24 | 7 | 12 | 12 | 681 | 1 | 4 | 5 | - |
| `praca-dla-studenta` | 77 | 21 | 24 | 8 | 11 | 13 | 1161 | 0 | 4 | 4 | 2026-09-09 |
| `praca-w-niedziele-i-swieta` | 77 | 22 | 24 | 7 | 12 | 12 | 633 | 1 | 2 | 3 | - |
| `rynek-pracy-administracja-publiczna` | 77 | 19 | 25 | 9 | 12 | 12 | 507 | 1 | 2 | 3 | - |
| `rynek-pracy-rolnictwo` | 77 | 23 | 24 | 7 | 12 | 11 | 562 | 1 | 2 | 3 | - |
| `szkolenie-bhp-wstepne` | 77 | 22 | 24 | 7 | 12 | 12 | 510 | 1 | 3 | 3 | - |
| `urlop-wypoczynkowy` | 77 | 19 | 25 | 9 | 12 | 12 | 694 | 1 | 9 | 5 | - |
| `zarzadzanie-czasem` | 77 | 22 | 24 | 8 | 12 | 11 | 536 | 1 | 3 | 3 | - |
| `zwolnienie-dyscyplinarne` | 77 | 22 | 24 | 7 | 12 | 12 | 654 | 1 | 3 | 4 | - |
| `zwolnienie-grupowe` | 77 | 22 | 24 | 7 | 12 | 12 | 563 | 1 | 3 | 4 | - |
| `cv-do-pracy` | 78 | 23 | 24 | 7 | 12 | 12 | 962 | 0 | 1 | 3 | 2026-09-02 |
| `cv-studenta` | 78 | 22 | 24 | 8 | 12 | 12 | 1314 | 0 | 2 | 3 | 2026-09-02 |
| `doradca-zawodowy` | 78 | 19 | 25 | 10 | 11 | 13 | 1122 | 1 | 10 | 4 | 2026-09-02 |
| `korporacja-czy-startup` | 78 | 24 | 24 | 7 | 12 | 11 | 632 | 1 | 2 | 3 | - |
| `kryzys-polowy-kariery` | 78 | 24 | 24 | 7 | 12 | 11 | 642 | 1 | 2 | 3 | - |
| `odprawa-emerytalna` | 78 | 24 | 24 | 7 | 12 | 11 | 542 | 1 | 2 | 3 | - |
| `plan-rozwoju-zawodowego` | 78 | 21 | 25 | 8 | 12 | 12 | 555 | 1 | 4 | 4 | - |
| `pytania-na-rozmowie-kwalifikacyjnej` | 78 | 24 | 24 | 7 | 11 | 12 | 1242 | 0 | 5 | 4 | 2026-09-02 |
| `rozmowa-kwalifikacyjna` | 78 | 23 | 24 | 7 | 11 | 13 | 1188 | 0 | 7 | 4 | 2026-09-02 |
| `rynek-pracy-farmacja` | 78 | 24 | 24 | 8 | 12 | 10 | 543 | 1 | 3 | 3 | - |
| `rynek-pracy-ubezpieczenia` | 78 | 24 | 24 | 7 | 12 | 11 | 557 | 1 | 3 | 3 | - |
| `test-kariery-online` | 78 | 18 | 25 | 11 | 11 | 13 | 1136 | 2 | 3 | 3 | 2026-09-02 |
| `urlop-od-kariery-sabbatical` | 78 | 19 | 25 | 9 | 12 | 13 | 598 | 1 | 3 | 4 | - |
| `wypalenie-zawodowe-co-dalej` | 78 | 18 | 25 | 11 | 11 | 13 | 1432 | 1 | 11 | 10 | 2026-09-09 |
| `cv-po-francusku` | 79 | 24 | 24 | 8 | 12 | 11 | 538 | 1 | 3 | 3 | - |
| `cv-po-hiszpansku` | 79 | 24 | 24 | 8 | 12 | 11 | 554 | 1 | 3 | 4 | - |
| `cv-prawnika` | 79 | 24 | 25 | 9 | 12 | 9 | 520 | 1 | 1 | 3 | - |
| `cv-programisty` | 79 | 24 | 24 | 7 | 12 | 12 | 624 | 1 | 2 | 4 | - |
| `cv-w-medycynie` | 79 | 21 | 25 | 9 | 12 | 12 | 643 | 1 | 2 | 4 | - |
| `darmowy-kreator-cv` | 79 | 21 | 24 | 8 | 12 | 14 | 1106 | 0 | 1 | 3 | 2026-09-02 |
| `delegacja-sluzbowa` | 79 | 24 | 24 | 7 | 12 | 12 | 530 | 1 | 4 | 3 | - |
| `kompetencje-miekkie-jak-rozwijac` | 79 | 24 | 24 | 7 | 12 | 12 | 586 | 1 | 7 | 6 | - |
| `list-motywacyjny` | 79 | 24 | 24 | 8 | 11 | 12 | 1082 | 0 | 3 | 4 | 2026-09-09 |
| `mobbing-w-pracy` | 79 | 25 | 24 | 7 | 12 | 11 | 607 | 1 | 3 | 4 | - |
| `praca-sezonowa-za-granica` | 79 | 24 | 25 | 9 | 12 | 9 | 593 | 1 | 6 | 5 | - |
| `rynek-pracy-nieruchomosci` | 79 | 24 | 24 | 7 | 12 | 12 | 563 | 1 | 3 | 3 | - |
| `rynek-pracy-turystyka` | 79 | 24 | 24 | 7 | 12 | 12 | 549 | 1 | 3 | 3 | - |
| `umowa-o-dzielo` | 79 | 24 | 24 | 7 | 12 | 12 | 561 | 1 | 2 | 3 | - |
| `urlop-ojcowski` | 79 | 24 | 24 | 7 | 12 | 12 | 505 | 1 | 1 | 3 | - |
| `wypowiedzenie-umowy-o-prace` | 79 | 24 | 24 | 7 | 12 | 12 | 665 | 1 | 7 | 3 | - |
| `zasilek-dla-bezrobotnych` | 79 | 24 | 24 | 7 | 12 | 12 | 571 | 1 | 2 | 3 | - |
| `jaki-zawod-wybrac` | 80 | 23 | 24 | 9 | 11 | 13 | 1840 | 2 | 9 | 3 | 2026-09-02 |
| `rynek-pracy-kultura-media` | 80 | 22 | 25 | 9 | 12 | 12 | 668 | 1 | 3 | 3 | - |
| `urlop-bezplatny` | 80 | 25 | 24 | 7 | 12 | 12 | 560 | 1 | 3 | 3 | - |
| `feedback-w-pracy` | 81 | 24 | 25 | 8 | 12 | 12 | 532 | 1 | 5 | 4 | - |
| `asertywnosc-w-pracy` | 82 | 24 | 25 | 9 | 12 | 12 | 551 | 1 | 2 | 3 | - |
| `cv-inzyniera` | 82 | 24 | 25 | 9 | 12 | 12 | 548 | 1 | 3 | 3 | - |
| `list-motywacyjny-po-angielsku` | 82 | 24 | 25 | 9 | 12 | 12 | 681 | 1 | 2 | 3 | - |
| `urlop-macierzynski-rodzicielski` | 82 | 24 | 25 | 9 | 12 | 12 | 609 | 1 | 3 | 4 | - |
| `europass-cv` | 83 | 25 | 25 | 9 | 12 | 12 | 545 | 1 | 4 | 4 | - |
| `doradztwo-zawodowe` | 84 | 25 | 25 | 10 | 11 | 13 | 1120 | 1 | 1 | 4 | 2026-09-02 |

---

## Drafts (excluded from the build)

Three `_`-prefixed files are filtered out by `getArticlesMetadata` and are not published. They score lowest in the raw batch because they were never finished - no internal links, no citations:

| File | Raw score | Note |
|------|-----------|------|
| `_doradca-finansowy-kiedy-skorzystac.md` | 44 | No internal links, no citations |
| `_ukryty-rynek-pracy.md` | 48 | No internal links, no citations |
| `_szukanie-pracy-w-dobie-ai.md` | 54 | No citations; a `/blog/Job/szukanie-pracy` 301 already points elsewhere |

Either finish them or delete them - they currently sit in the repo scoring 44-54 with no path to publication.

---

## Method and limits

- Per-post scores come from `analyze_blog.py --batch --format json`, then corrected +6 site-wide for route-emitted schema and OG.
- The analyzer's scale is an internal editorial heuristic. It is **not** a calibrated probability and **not** an authorship classifier; `likely_ai` was null on every post and is not used here.
- Readability used the analyzer's `fog_pl` model. Polish-language scoring is less well calibrated than English - readability sub-scores (avg 4.59/7) are reported but not weighted in any recommendation.
- Link graph, citation counts, cannibalization clustering, freshness and metadata checks were computed directly from the markdown and the Next.js source, independent of the analyzer.
- Cannibalization clustering used title+slug token Jaccard with Polish stopword and diacritic normalization. Boilerplate H2s (`FAQ`, `Podsumowanie`, `Powiazane artykuly`) were excluded after they inflated the first pass.
- **SKIPPED: Google Search Console, GA4, PageSpeed/CrUX, URL Inspection, indexing status** - credentials unavailable (`blog-google` not configured). No query-level cannibalization, traffic-decay or Core Web Vitals data informed this report; all cannibalization findings are content-derived and should be confirmed against GSC query-to-URL data before any merge or 301.
- **SKIPPED: live HTTP status, redirect-chain and canonical verification** - the audit read source, not a running site. The four `next.config.ts` redirects were verified to have existing targets with matching categories, but were not executed.
- **SKIPPED: SERP overlap** - no SERP API configured.
