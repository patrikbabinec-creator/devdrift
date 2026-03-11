# DevDrift

> How the programming profession changed · 1970–2026

An open-source, static site visualising how senior developer skill expectations evolved over 56 years. Four interactive Chart.js charts, Cookielab brand, powered by community data.

**Powered by [Cookielab](https://cookielab.io) & Pavel Žák — giving back to the developer community.**

---

## Getting started

Requires **Node.js 18+** and **npm**.

```bash
npm install
npm run dev
```

Then open **http://localhost:4321** in your browser.

## Other commands

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

## Stack

- [Astro 5](https://astro.build) — static site framework
- [React 19](https://react.dev) — interactive chart islands
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [Chart.js v4](https://www.chartjs.org) — charts

## Adding or editing skills

All skill data lives in [`public/data/skills-timeline.json`](public/data/skills-timeline.json). Each skill has a name, category, description, and year-by-year values on a 0–10 scale (logistic S-curve). No code changes needed — just edit the JSON and refresh.

See [`CLAUDE.md`](CLAUDE.md) for full developer documentation.

## Deployment

Cloudflare Pages — see `CLAUDE.md` for GitHub Actions workflow details.

## License

MIT
