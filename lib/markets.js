// Market templates modelled on Singapore Pools football (soccer) betting markets.
// Odds are DECIMAL odds (e.g. 2.10), which is what Singapore Pools displays.
// Each template lists the selections a punter can enter odds for.

export const MARKET_TEMPLATES = [
  {
    id: "1x2",
    name: "1X2 (Full Time Result)",
    short: "1X2",
    hint: "Home win / Draw / Away win at full time.",
    // partition = the selections are mutually exclusive and cover every
    // outcome, so their fair probabilities should sum to ~100%. Only then can
    // the bookmaker's margin be stripped out meaningfully.
    partition: true,
    selections: [
      { key: "home", label: "1 — Home win" },
      { key: "draw", label: "X — Draw" },
      { key: "away", label: "2 — Away win" },
    ],
  },
  {
    id: "double_chance",
    name: "Double Chance",
    short: "Dbl Chance",
    hint: "Two of the three 1X2 outcomes. Selections overlap, so no market margin is computed — odds shown as-is.",
    partition: false, // 1X, 12, X2 overlap — not a clean partition
    selections: [
      { key: "1x", label: "1X — Home or Draw" },
      { key: "12", label: "12 — Home or Away" },
      { key: "x2", label: "X2 — Draw or Away" },
    ],
  },
  {
    id: "ou25",
    name: "Total Goals — Over/Under 2.5",
    short: "O/U 2.5",
    hint: "Total goals in the match above or below 2.5.",
    partition: true,
    selections: [
      { key: "over", label: "Over 2.5" },
      { key: "under", label: "Under 2.5" },
    ],
  },
  {
    id: "btts",
    name: "Both Teams To Score",
    short: "BTTS",
    hint: "Do both teams score at least one goal?",
    partition: true,
    selections: [
      { key: "yes", label: "Yes" },
      { key: "no", label: "No" },
    ],
  },
  {
    id: "htft",
    name: "Halftime / Fulltime",
    short: "HT/FT",
    hint: "Leader at halftime paired with the full-time result. 9 combinations, higher variance. Enter all 9 for an accurate margin.",
    partition: true,
    selections: [
      { key: "hh", label: "Home / Home" },
      { key: "hd", label: "Home / Draw" },
      { key: "ha", label: "Home / Away" },
      { key: "dh", label: "Draw / Home" },
      { key: "dd", label: "Draw / Draw" },
      { key: "da", label: "Draw / Away" },
      { key: "ah", label: "Away / Home" },
      { key: "ad", label: "Away / Draw" },
      { key: "aa", label: "Away / Away" },
    ],
  },
  {
    id: "fh1x2",
    name: "First Half — 1X2",
    short: "1st Half",
    hint: "Result of the first half only.",
    partition: true,
    selections: [
      { key: "home", label: "1 — Home leads at HT" },
      { key: "draw", label: "X — Level at HT" },
      { key: "away", label: "2 — Away leads at HT" },
    ],
  },
  {
    id: "correct_score",
    name: "Correct Score",
    short: "Score",
    hint: "Exact final scoreline. Highest payout, highest risk. Add your own scorelines. (No full margin — you'll only enter a few of the many possible scores.)",
    partition: false, // you only ever enter a subset of all possible scores
    custom: true,
    selections: [],
  },
];

export function templateById(id) {
  return MARKET_TEMPLATES.find((m) => m.id === id);
}
