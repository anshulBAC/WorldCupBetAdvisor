import { getResults, getUpcoming } from "@/lib/sportsdb";

// Live World Cup 2026 scores: recent results + upcoming fixtures.
export async function GET() {
  try {
    const [results, upcoming] = await Promise.all([
      getResults(),
      getUpcoming(),
    ]);
    // Newest results first, soonest fixtures first.
    results.sort((a, b) => (a.date < b.date ? 1 : -1));
    upcoming.sort((a, b) => (a.date > b.date ? 1 : -1));
    return Response.json({
      source: "TheSportsDB · FIFA World Cup 2026",
      updatedAt: new Date().toISOString(),
      results,
      upcoming,
    });
  } catch (err) {
    return Response.json(
      { error: "Could not load scores: " + (err?.message || "unknown") },
      { status: 502 }
    );
  }
}
