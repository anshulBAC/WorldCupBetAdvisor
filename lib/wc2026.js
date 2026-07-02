// FIFA World Cup 2026 reference data (USA · Canada · Mexico, 48 teams).
// Used to organise live TheSportsDB fixtures into the tournament's official
// stages. Dates are the published competition windows.

export const TSDB_LEAGUE_ID = "4429"; // FIFA World Cup on TheSportsDB
export const TSDB_SEASON = "2026";

// Stage windows (inclusive) — a fixture's date decides which table it lands in.
export const STAGES = [
  { id: "group", name: "Group Stage", from: "2026-06-11", to: "2026-06-27" },
  { id: "r32", name: "Round of 32", from: "2026-06-28", to: "2026-07-03" },
  { id: "r16", name: "Round of 16", from: "2026-07-04", to: "2026-07-07" },
  { id: "qf", name: "Quarter-finals", from: "2026-07-09", to: "2026-07-11" },
  { id: "sf", name: "Semi-finals", from: "2026-07-14", to: "2026-07-15" },
  { id: "third", name: "Third-place Play-off", from: "2026-07-18", to: "2026-07-18" },
  { id: "final", name: "Final", from: "2026-07-19", to: "2026-07-19" },
];

export function stageForDate(dateStr) {
  if (!dateStr) return null;
  for (const s of STAGES) {
    if (dateStr >= s.from && dateStr <= s.to) return s.id;
  }
  // Anything on/after the group window start but unmatched → treat as group.
  if (dateStr >= STAGES[0].from) return "group";
  return null;
}

export const HOST_CITIES = [
  "Atlanta", "Boston", "Dallas", "Guadalajara", "Houston", "Kansas City",
  "Los Angeles", "Mexico City", "Miami", "Monterrey", "New York/New Jersey",
  "Philadelphia", "San Francisco Bay Area", "Seattle", "Toronto", "Vancouver",
];
