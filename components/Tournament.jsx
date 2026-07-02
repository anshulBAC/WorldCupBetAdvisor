"use client";

import { useState } from "react";
import { useApi, timeAgo } from "./useApi";

function StandingsTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="empty">Standings not available from the feed yet.</p>;
  }
  return (
    <div className="tablewrap">
      <table className="standings">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: "left" }}>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team + i}>
              <td>{r.rank || i + 1}</td>
              <td style={{ textAlign: "left" }} className="team-cell">
                {r.badge && <img src={r.badge} alt="" className="badge-img" />}
                {r.team}
              </td>
              <td>{r.played}</td>
              <td>{r.win}</td>
              <td>{r.draw}</td>
              <td>{r.loss}</td>
              <td>{r.gf}</td>
              <td>{r.ga}</td>
              <td>{r.gd > 0 ? "+" + r.gd : r.gd}</td>
              <td className="pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StageMatches({ stage }) {
  if (!stage.matches || stage.matches.length === 0) {
    return (
      <p className="empty">
        No fixtures for the {stage.name} yet ({fmt(stage.from)}–{fmt(stage.to)}).
        This table fills automatically as the schedule is published.
      </p>
    );
  }
  return (
    <div className="match-grid">
      {stage.matches.map((m) => {
        const played = m.homeScore != null && m.awayScore != null;
        return (
          <div className="match-card" key={m.id}>
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
          </div>
        );
      })}
    </div>
  );
}

function fmt(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function Tournament() {
  const { data, loading, error, reload } = useApi("/api/tournament");
  const [tab, setTab] = useState("standings");

  const stages = data?.stages || [];
  const activeStage = stages.find((s) => s.id === tab);

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">Tournament</h2>
        <div className="section-actions">
          {data && <span className="updated">Updated {timeAgo(data.updatedAt)}</span>}
          <button className="btn btn-ghost btn-sm" onClick={reload}>
            ↻ Refresh
          </button>
        </div>
      </div>
      <p className="src-note">
        Source: {data?.source || "TheSportsDB · FIFA World Cup 2026"}. Fixtures are
        grouped into the official 2026 stages by match date.
      </p>

      <div className="stage-tabs">
        <button
          className={"stage-tab" + (tab === "standings" ? " on" : "")}
          onClick={() => setTab("standings")}
        >
          Group Standings
        </button>
        {stages.map((s) => (
          <button
            key={s.id}
            className={"stage-tab" + (tab === s.id ? " on" : "")}
            onClick={() => setTab(s.id)}
          >
            {s.name}
            {s.matches.length > 0 && <span className="count">{s.matches.length}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton-grid">{[0, 1, 2].map((i) => <div key={i} className="skel wide" />)}</div>}
      {error && <div className="errbox">{error}</div>}

      {data && tab === "standings" && <StandingsTable rows={data.standings} />}
      {data && activeStage && <StageMatches stage={activeStage} />}
    </div>
  );
}
