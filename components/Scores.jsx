"use client";

import { useApi, timeAgo } from "./useApi";

function MatchCard({ m, live }) {
  const played = m.homeScore != null && m.awayScore != null;
  return (
    <div className="match-card">
      <div className="mc-meta">
        <span>{m.date}</span>
        {m.time && <span>· {m.time}</span>}
        <span className={"mc-status" + (m.status === "FT" ? " ft" : "")}>
          {m.status}
        </span>
      </div>
      <div className="mc-teams">
        <span className="mc-team">{m.home}</span>
        {played ? (
          <span className="mc-score">
            {m.homeScore} <span className="mc-dash">–</span> {m.awayScore}
          </span>
        ) : (
          <span className="mc-vs">vs</span>
        )}
        <span className="mc-team away">{m.away}</span>
      </div>
      {m.venue && <div className="mc-venue">{m.venue}</div>}
    </div>
  );
}

export default function Scores() {
  const { data, loading, error, reload } = useApi("/api/scores");

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">Live Scores</h2>
        <div className="section-actions">
          {data && (
            <span className="updated">Updated {timeAgo(data.updatedAt)}</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={reload}>
            ↻ Refresh
          </button>
        </div>
      </div>
      <p className="src-note">
        Source: {data?.source || "TheSportsDB · FIFA World Cup 2026"}. Free public
        data — coverage can be limited or delayed.
      </p>

      {loading && <div className="skeleton-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" />)}</div>}
      {error && <div className="errbox">{error}</div>}

      {data && (
        <>
          <h3 className="sub">Latest results</h3>
          {data.results.length === 0 ? (
            <p className="empty">No completed matches reported yet.</p>
          ) : (
            <div className="match-grid">
              {data.results.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          )}

          <h3 className="sub">Upcoming fixtures</h3>
          {data.upcoming.length === 0 ? (
            <p className="empty">No upcoming fixtures listed right now.</p>
          ) : (
            <div className="match-grid">
              {data.upcoming.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
