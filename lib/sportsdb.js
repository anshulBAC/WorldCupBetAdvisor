// Thin server-side client for TheSportsDB free tier (no account needed).
// Key can be overridden with THESPORTSDB_KEY; "3" is the shared free demo key.
import { TSDB_LEAGUE_ID, TSDB_SEASON } from "@/lib/wc2026";

const KEY = process.env.THESPORTSDB_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

async function getJson(url) {
  const res = await fetch(url, {
    // Revalidate at most once a minute so we don't hammer the free tier.
    next: { revalidate: 60 },
    headers: { "User-Agent": "sgp-risk-advisor" },
  });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}`);
  return res.json();
}

function normEvent(e) {
  const hs = e.intHomeScore;
  const as = e.intAwayScore;
  const played = hs !== null && hs !== "" && as !== null && as !== "";
  return {
    id: e.idEvent,
    name: e.strEvent,
    home: e.strHomeTeam,
    away: e.strAwayTeam,
    homeScore: played ? Number(hs) : null,
    awayScore: played ? Number(as) : null,
    date: e.dateEvent,
    time: (e.strTime || "").slice(0, 5),
    status: e.strStatus || (played ? "FT" : "Scheduled"),
    round: e.intRound || null,
    venue: e.strVenue || null,
    thumb: e.strThumb || null,
  };
}

export async function getResults() {
  const d = await getJson(`${BASE}/eventspastleague.php?id=${TSDB_LEAGUE_ID}`);
  return (d.events || []).map(normEvent);
}

export async function getUpcoming() {
  const d = await getJson(`${BASE}/eventsnextleague.php?id=${TSDB_LEAGUE_ID}`);
  return (d.events || []).map(normEvent);
}

export async function getSeasonEvents() {
  const d = await getJson(
    `${BASE}/eventsseason.php?id=${TSDB_LEAGUE_ID}&s=${TSDB_SEASON}`
  );
  return (d.events || []).map(normEvent);
}

export async function getStandings() {
  const d = await getJson(
    `${BASE}/lookuptable.php?l=${TSDB_LEAGUE_ID}&s=${TSDB_SEASON}`
  );
  // The free feed's intRank is unreliable (often all 1) and rows arrive
  // unsorted — order by points, then goal difference, then goals scored.
  const rows = (d.table || []).map((t) => ({
    team: t.strTeam,
    played: num(t.intPlayed),
    win: num(t.intWin),
    draw: num(t.intDraw),
    loss: num(t.intLoss),
    gf: num(t.intGoalsFor),
    ga: num(t.intGoalsAgainst),
    gd: num(t.intGoalDifference),
    points: num(t.intPoints),
    badge: t.strBadge || null,
  }));
  rows.sort(
    (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf
  );
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

function num(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}
