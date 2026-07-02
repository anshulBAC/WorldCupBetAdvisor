import {
  getResults,
  getUpcoming,
  getSeasonEvents,
  getStandings,
} from "@/lib/sportsdb";
import { STAGES, stageForDate } from "@/lib/wc2026";

// Full tournament view: standings table + every known fixture bucketed into the
// official WC2026 stages (Group Stage → Round of 32/16 → QF → SF → Final).
export async function GET() {
  try {
    const [results, upcoming, season, standings] = await Promise.all([
      getResults().catch(() => []),
      getUpcoming().catch(() => []),
      getSeasonEvents().catch(() => []),
      getStandings().catch(() => []),
    ]);

    // Merge all fixtures, de-dupe by id.
    const byId = new Map();
    [...season, ...results, ...upcoming].forEach((e) => {
      if (e && e.id) byId.set(e.id, e);
    });
    const all = [...byId.values()];

    // Bucket into stages by date.
    const stages = STAGES.map((s) => ({ ...s, matches: [] }));
    const index = Object.fromEntries(stages.map((s) => [s.id, s]));
    all.forEach((e) => {
      const sid = stageForDate(e.date);
      if (sid && index[sid]) index[sid].matches.push(e);
    });
    stages.forEach((s) =>
      s.matches.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    );

    return Response.json({
      source: "TheSportsDB · FIFA World Cup 2026",
      updatedAt: new Date().toISOString(),
      standings,
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        from: s.from,
        to: s.to,
        matches: s.matches,
      })),
    });
  } catch (err) {
    return Response.json(
      { error: "Could not load tournament data: " + (err?.message || "unknown") },
      { status: 502 }
    );
  }
}
