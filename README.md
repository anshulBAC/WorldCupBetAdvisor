# Singapore Pools — Bet Risk Advisor

A web app that turns Singapore Pools football odds into **honest math** so you can
decide where a fixed budget (e.g. S$100) is best placed across markets like 1X2,
Double Chance, Over/Under, BTTS, Halftime/Fulltime, First Half and Correct Score.

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

- **Frontend:** Next.js (App Router) + React — a single dashboard page.
- **Backend:** a stateless API route `POST /api/analyze` that runs the risk engine
  (`lib/risk.js`). No database.
- **Storage:** none. Your inputs live in the browser tab's `sessionStorage` and
  are **wiped automatically when you close the tab** (the "cache that clears on
  close" you asked for).

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
