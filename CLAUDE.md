# DevDrift — CLAUDE.md

## What this project is
devdrift.dev — an open-source, static site documenting how senior developer skill expectations changed from 1970 to 2026. Powered by Cookielab & Pavel Žák.

## Stack
- **Astro 5.x** — static output (`output: 'static'`)
- **React 19** — interactive chart islands (`client:only="react"`)
- **Tailwind CSS v4** — via `@tailwindcss/vite` Vite plugin (NOT `@astrojs/tailwind`)
- **Chart.js v4** — direct API (not react-chartjs-2)
- **TypeScript** — strict mode

## Commands
```bash
cd devdrift
npm install        # install dependencies
npm run dev        # dev server → http://localhost:4321
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Brand tokens
| Token | Value |
|-------|-------|
| Gold (primary) | `#FFCD68` |
| Dark bg | `#1E1E1E` |
| Surface | `#252525` |
| Surface2 | `#2e2e2e` |
| Border | `#3a3a3a` |
| Off-white | `#F2F0E5` |
| Muted | `#94a3b8` |
| Muted2 | `#64748b` |
| Purple (accent) | `#787A9D` |
| Font heading | Raleway 700/800/900 |
| Font body | Inter 400/500/600 |

Gold on dark is the signature Cookielab look. Use gold for accents, highlights, key headings — never gold on white.

## File structure
```
devdrift/
  public/data/
    categories.json       — 9 category keys → label + color
    key-events.json       — 8 historical milestones for chart annotations
    skills-timeline.json  — 22 skills with S-curve values 1970–2026
    population-data.json  — worldwide developer count estimates
    complexity-data.json  — 5 complexity indicator series
  src/
    layouts/BaseLayout.astro        — HTML shell, Google Fonts, meta
    pages/index.astro               — page composition
    components/
      HeroSection.astro             — hero with gold DevDrift logo
      ChartSection.astro            — dark card wrapper (id, title, subtitle)
      Footer.astro                  — Cookielab attribution
      SkillFilters.tsx              — category toggle buttons + owns state
      SkillsChart.tsx               — main timeline chart (receives activeCategories)
      PopulationChart.tsx           — dev population line chart
      CategoryTrendChart.tsx        — per-category average trends
      ComplexityChart.tsx           — 5-series complexity indicators
    styles/global.css               — Tailwind v4 @theme tokens
```

## Data format — skills-timeline.json
```json
{
  "skills": [
    {
      "name": "Skill Name",
      "category": "technical_core",
      "description": "One paragraph English description.",
      "values": { "1970": 0, ..., "2026": 9.8 }
    }
  ]
}
```
Scale: 0 = irrelevant, 5 = useful not required, 8 = expected of senior, 10 = table-stakes standard.
Values follow a logistic S-curve from 0 to plateau.

## Chart islands pattern
All charts use `client:only="react"` — they fetch their own data from `/data/*.json` on mount.
Do NOT use SSR data passing — keep fetches in `useEffect`.

Chart.js modules must be explicitly registered. Example:
```ts
import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip);
```

## Adding a new skill
1. Add an entry to `public/data/skills-timeline.json`
2. Use one of the 9 category keys from `categories.json`
3. Provide values for all years 1970–2026 following S-curve shape
4. No code changes needed — charts load data dynamically

## Deployment (future)
Cloudflare Pages via GitHub Actions with `cloudflare/wrangler-action`.
Secrets needed: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Project name: `devdrift-dev`. Build output: `devdrift/dist/`.
