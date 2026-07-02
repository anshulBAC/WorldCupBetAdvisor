// Core betting-math engine. Pure functions, no I/O — used by the /api/analyze route.
//
// Honest framing: none of this predicts winners. It converts decimal odds into
// probabilities, strips out the bookmaker's built-in margin, and — if the user
// supplies their own confidence — measures whether a bet has positive expected
// value and how much to stake (Kelly). Risk = variance of the outcome.

import { templateById } from "@/lib/markets";

function round(n, dp = 2) {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
}

// Risk band from the fair (vig-removed) win probability of a single selection.
function riskBand(fairProb) {
  if (fairProb >= 0.6) return { label: "Low", level: 1 };
  if (fairProb >= 0.4) return { label: "Medium", level: 2 };
  if (fairProb >= 0.25) return { label: "High", level: 3 };
  if (fairProb >= 0.12) return { label: "Very High", level: 4 };
  return { label: "Extreme", level: 5 };
}

// Analyse a single market: a list of { key, label, odds, confidence? }.
// odds are decimal; confidence (0-100) is the user's own win estimate (optional).
// `fullCount` = how many selections the market has in total; `partition` = whether
// the selections are mutually exclusive & exhaustive. Vig can only be stripped
// (and a house margin quoted) when the punter has entered a COMPLETE partition —
// otherwise the numbers would be meaningless (e.g. overlapping Double Chance).
export function analyzeMarket(market, stake, { fullCount = 0, partition = true } = {}) {
  const valid = market.selections.filter(
    (s) => typeof s.odds === "number" && s.odds > 1
  );
  if (valid.length === 0) {
    return { ...market, analyzed: false, selections: [] };
  }

  const rawOverround = valid.reduce((acc, s) => acc + 1 / s.odds, 0);
  const complete = partition && fullCount > 0 && valid.length === fullCount;
  // Only a complete partition yields a meaningful margin / vig-removed prob.
  const marginPct = complete ? round((rawOverround - 1) * 100, 2) : null;
  const normDivisor = complete ? rawOverround : 1;

  const selections = valid.map((s) => {
    const impliedProb = 1 / s.odds;
    const fairProb = impliedProb / normDivisor; // vig removed only if complete
    const payout = round(stake * s.odds, 2);
    const profit = round(stake * (s.odds - 1), 2);

    // Expected value using the market's own fair probability = -vig share.
    // Only meaningful for a complete partition (otherwise fairProb == implied).
    const marketEV = complete ? round(stake * (fairProb * s.odds - 1), 2) : null;

    let userEdge = null; // EV per $1 using the user's confidence
    let userEV = null; // EV in $ for this stake
    let kellyFraction = null; // fraction of bankroll Kelly suggests
    let valueVsMarket = null; // user prob minus fair prob (percentage points)

    if (typeof s.confidence === "number" && s.confidence > 0) {
      const p = Math.min(Math.max(s.confidence / 100, 0), 1);
      userEdge = round(p * s.odds - 1, 4);
      userEV = round(stake * userEdge, 2);
      const b = s.odds - 1;
      const k = (p * s.odds - 1) / b; // Kelly = edge / (odds-1)
      kellyFraction = round(Math.max(0, k), 4);
      valueVsMarket = round((p - fairProb) * 100, 1);
    }

    const band = riskBand(fairProb);

    return {
      key: s.key,
      label: s.label,
      odds: s.odds,
      impliedProbPct: round(impliedProb * 100, 1),
      fairProbPct: round(fairProb * 100, 1),
      payout,
      profit,
      marketEV,
      userEdgePct: userEdge === null ? null : round(userEdge * 100, 1),
      userEV,
      kellyStake:
        kellyFraction === null ? null : round(kellyFraction * stake, 2),
      valueVsMarket,
      risk: band,
    };
  });

  // Best value selection = the one where the user (or market) sees most edge.
  // If no confidence given, fall back to lowest-risk (highest fair prob).
  const best = [...selections].sort((a, b) => {
    if (a.userEV !== null && b.userEV !== null) return b.userEV - a.userEV;
    return b.fairProbPct - a.fairProbPct;
  })[0];

  return {
    id: market.id,
    name: market.name,
    short: market.short,
    hint: market.hint,
    analyzed: true,
    marginPct,
    selections,
    bestKey: best ? best.key : null,
  };
}

// Rank markets by how much of your money the bookmaker keeps (lower = better value).
function marginQuality(marginPct) {
  if (marginPct <= 5) return "Excellent";
  if (marginPct <= 8) return "Good";
  if (marginPct <= 12) return "Fair";
  return "Poor";
}

// Build an overall recommendation for a budget and risk appetite.
// appetite: "conservative" | "balanced" | "aggressive"
function buildRecommendation(markets, budget, appetite) {
  const picks = [];
  markets.forEach((m) => {
    if (!m.analyzed) return;
    m.selections.forEach((s) => {
      picks.push({ ...s, market: m.name, marketMargin: m.marginPct });
    });
  });
  if (picks.length === 0) return null;

  const hasConfidence = picks.some((p) => p.userEV !== null);

  // Target probability band per appetite (used when no confidence supplied).
  const targetProb =
    appetite === "conservative" ? 0.5 : appetite === "aggressive" ? 0.2 : 0.35;

  const scored = picks.map((p) => {
    let score;
    if (hasConfidence && p.userEV !== null) {
      // Reward positive edge, penalise bookmaker margin and (for cautious
      // punters) high variance.
      const riskPenalty =
        appetite === "conservative"
          ? p.risk.level * 0.5
          : appetite === "aggressive"
          ? 0
          : p.risk.level * 0.2;
      score = p.userEdgePct - p.marketMargin * 0.3 - riskPenalty;
    } else {
      // No confidence: prefer selections near the appetite's target probability
      // and markets with low margin.
      const probGap = Math.abs(p.fairProbPct / 100 - targetProb);
      score = -probGap * 100 - p.marketMargin * 0.5;
    }
    return { ...p, score: round(score, 2) };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  // Suggested allocation of the budget across the top picks.
  let allocation = [];
  if (hasConfidence) {
    // Weight by Kelly stake (fractional), capped so we never bet more than budget.
    const kellySum = top.reduce((acc, p) => acc + (p.kellyStake || 0), 0);
    if (kellySum > 0) {
      allocation = top.map((p) => ({
        key: p.key,
        market: p.market,
        label: p.label,
        amount: round((budget * (p.kellyStake || 0)) / kellySum, 2),
      }));
    }
  }
  if (allocation.length === 0) {
    // Simple weighting: conservative concentrates on the top pick; aggressive
    // spreads a little more.
    const weights =
      appetite === "conservative"
        ? [0.7, 0.2, 0.1]
        : appetite === "aggressive"
        ? [0.5, 0.3, 0.2]
        : [0.6, 0.25, 0.15];
    allocation = top.map((p, i) => ({
      key: p.key,
      market: p.market,
      label: p.label,
      amount: round(budget * (weights[i] || 0), 2),
    }));
  }

  return {
    appetite,
    hasConfidence,
    top: top.map((p) => ({
      market: p.market,
      label: p.label,
      odds: p.odds,
      fairProbPct: p.fairProbPct,
      risk: p.risk,
      userEdgePct: p.userEdgePct,
      marketMargin: p.marketMargin,
    })),
    allocation,
  };
}

// Top-level entry point called by the API route.
export function analyzeSlip({ budget, appetite, markets }) {
  const stake = Number(budget) > 0 ? Number(budget) : 100;
  const analyzedMarkets = markets
    .map((m) => {
      const t = templateById(m.id);
      return analyzeMarket(m, stake, {
        fullCount: t ? t.selections.length : 0,
        partition: t ? t.partition !== false : false,
      });
    })
    .filter((m) => m.analyzed);

  // Only markets with a real (complete-partition) margin can be value-ranked.
  const marketSummary = analyzedMarkets
    .filter((m) => m.marginPct != null)
    .map((m) => ({
      id: m.id,
      name: m.name,
      short: m.short,
      marginPct: m.marginPct,
      quality: marginQuality(m.marginPct),
    }))
    .sort((a, b) => a.marginPct - b.marginPct);

  const recommendation = buildRecommendation(
    analyzedMarkets,
    stake,
    appetite || "balanced"
  );

  return {
    stake,
    generatedAt: new Date().toISOString(),
    markets: analyzedMarkets,
    marketSummary,
    recommendation,
  };
}
