# Vocare — Instagram showcase films

Four vertical (1080×1920, 60 fps) product films, one per feature, for Reels/Stories.

| Film | Source | Output | Length |
| --- | --- | --- | --- |
| Doradca kariery AI | `doradca.html` | `out/vocare-doradca.mp4` | 16.8 s |
| Analiza rynku AI | `analiza.html` | `out/vocare-analiza.mp4` | 16.9 s |
| Roadmapa kariery | `roadmapa.html` | `out/vocare-roadmapa.mp4` | 17.0 s |
| Kreator CV | `kreator.html` | `out/vocare-kreator.mp4` | 17.6 s |

Every film follows the same arc: statement → answer → the feature at work → shared outro
(feature name, logo reveal, tagline, `vocare.pl`). Films are silent so music can be added in Instagram.

## How it works

- `shared/engine.js` — a tiny deterministic timeline. Each frame is a pure function of `t`, so frames
  can be rendered one by one with no dropped or uneven frames.
- `shared/base.css` — brand tokens (Space Grotesk + IBM Plex Mono, `#915EFF` accent, dark glass surfaces).
- `render.mjs` — opens each film in headless Chromium (Playwright), seeks every frame, and pipes PNGs into
  ffmpeg (H.264 High, CRF 16, light temporal grain against gradient banding).

## Motion language

| Token | Curve | Used for |
| --- | --- | --- |
| `outExpo` | `cubic-bezier(.19, 1, .22, 1)` | headline words, cards landing, counters |
| `outQuart` | `cubic-bezier(.165, .84, .44, 1)` | ticks, small fills |
| `inOutCubic` | `cubic-bezier(.645, .045, .355, 1)` | exits, line drawing, focus shifts |
| `inOutQuart` | `cubic-bezier(.77, 0, .175, 1)` | camera moves (roadmap pull-back, CV step-back) |

Entrances: 0.9–1.3 s, blur 14→0 px, rise 40–160 px, scale .9–.97→1, 70 ms word stagger.
Exits: 0.5 s, faster than entrances. No bounce anywhere — calm, product-first motion.
Every scene sits under a slow linear push-in (≈4%) so nothing is ever fully static.

## Commands

```bash
cd marketing/showcase
node render.mjs                      # render all four films to out/
node render.mjs roadmapa             # one film
node render.mjs kreator 30           # custom fps
./sheet.sh analiza 2,6,9.5           # contact sheet of chosen frames → out/stills/
```

Preview in a browser through any static server (`npx http-server marketing/showcase`), then open
`doradca.html` (loops in real time) or `doradca.html?t=7.5` (frozen frame).
Requires Node 18+, ffmpeg and Playwright's Chromium.
