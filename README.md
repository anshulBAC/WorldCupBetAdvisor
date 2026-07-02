# World Cup 2026 — Bet Risk Advisor

A FIFA World Cup 2026–themed web app with four sections:

- **Live Scores** — latest results & upcoming fixtures from TheSportsDB
  (FIFA World Cup, season 2026; free public API, no key required)
- **Tournament** — live group standings plus fixture tables for every official
  stage: Group Stage, Round of 32, Round of 16, Quarter-finals, Semi-finals,
  Third-place Play-off and the Final (fixtures bucketed by the official date
  windows)
- **News** — live football headlines from BBC Sport & ESPN RSS, with World Cup
  stories pinned first
- **Bet Advisor** — turns Singapore Pools football odds into **honest math** so
  you can decide where a fixed budget (e.g. S$100) is best placed across markets
  like 1X2, Double Chance, Over/Under, BTTS, Halftime/Fulltime, First Half and
  Correct Score.

> **This does not predict winners — no tool can.** Every betting market carries a
> negative expected value on average because of the bookmaker's built-in margin.
> This app just makes that math visible so your decisions are informed. 18+.
> Problem gambling helpline (Singapore): **1800-6-668-668**.

## What it computes

For each selection you enter decimal odds for:

- **Implied probability** — `1 / odds`
- **Fair probability** — implied probability with the bookmaker's margin removed
- **House margin (overround)** per market — how much edge the bookmaker keeps.
  Markets are ranked lowest-margin-first (best value for you).
- **Payout & profit** for your stake
- **Risk rating** — Low → Extreme, from the outcome's variance
- **Expected value & Kelly stake** — only when you add *your own confidence %*
  for a selection. This measures whether *you* think a bet is mispriced and how
  much of your bankroll to commit.
- **Budget allocation** — suggested split of your budget across the top picks,
  matched to your risk appetite (Conservative / Balanced / Aggressive).

## Architecture

- **Frontend:** Next.js (App Router) + React — a tabbed dashboard
  (`app/page.jsx` + `components/`).
- **Backend API routes** (all stateless, no database):
  - `POST /api/analyze` — the betting risk engine (`lib/risk.js`)
  - `GET /api/scores` — live results & fixtures (TheSportsDB)
  - `GET /api/tournament` — standings + stage-bucketed fixtures
  - `GET /api/news` — parsed RSS headlines (BBC Sport, ESPN)
- **Storage:** none. Your analyzer inputs live in the browser tab's
  `sessionStorage` and are **wiped automatically when you close the tab** (the
  "cache that clears on close" you asked for). Server responses are cached
  briefly (60s scores / 5min news) to respect the free APIs.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy (Vercel, free)

This repo deploys to Vercel with zero config — it's a standard Next.js app.
Import the GitHub repo at [vercel.com/new](https://vercel.com/new), or run
`vercel` from the project root.

## Data source

Odds are entered manually (paste from the Singapore Pools app / website). This is
100% reliable, avoids scraping their site (which is against their terms and is
technically fragile), and needs no server or database. The "News & factors" box is
a personal notepad to keep your reasoning honest — the app never invents news.

---

Educational tool. Not financial or betting advice. Not affiliated with Singapore
Pools.
