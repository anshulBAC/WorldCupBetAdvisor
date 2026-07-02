import { analyzeSlip } from "@/lib/risk";

// Backend endpoint: receives the punter's odds slip, returns the full risk
// analysis. Stateless — nothing is persisted server-side (no database).
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.markets)) {
      return Response.json(
        { error: "Request must include a `markets` array." },
        { status: 400 }
      );
    }

    // Sanitise: coerce odds/confidence to numbers, drop empty selections.
    const markets = body.markets
      .map((m) => ({
        id: String(m.id || ""),
        name: String(m.name || m.id || "Market"),
        short: String(m.short || ""),
        hint: String(m.hint || ""),
        selections: (Array.isArray(m.selections) ? m.selections : [])
          .map((s) => {
            const odds = parseFloat(s.odds);
            const confidence =
              s.confidence === "" || s.confidence == null
                ? null
                : parseFloat(s.confidence);
            return {
              key: String(s.key || ""),
              label: String(s.label || s.key || ""),
              odds: Number.isFinite(odds) ? odds : null,
              confidence: Number.isFinite(confidence) ? confidence : null,
            };
          })
          .filter((s) => s.odds && s.odds > 1),
      }))
      .filter((m) => m.selections.length > 0);

    if (markets.length === 0) {
      return Response.json(
        { error: "Enter decimal odds (> 1.00) for at least one selection." },
        { status: 400 }
      );
    }

    const result = analyzeSlip({
      budget: body.budget,
      appetite: body.appetite,
      markets,
    });

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: "Could not analyze slip: " + (err?.message || "unknown error") },
      { status: 500 }
    );
  }
}
