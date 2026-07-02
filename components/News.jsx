"use client";

import { useApi, timeAgo } from "./useApi";

export default function News() {
  const { data, loading, error, reload } = useApi("/api/news");

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">Football News</h2>
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
        Live headlines from BBC Sport &amp; ESPN RSS. World Cup stories are pinned
        to the top.
      </p>

      {loading && <div className="skeleton-grid">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel wide" />)}</div>}
      {error && <div className="errbox">{error}</div>}

      {data && (
        <div className="news-list">
          {data.items.map((n, i) => (
            <a
              key={i}
              className="news-item"
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="news-src">
                <span className="news-dot" />
                {n.source}
                {n.pubDate && <span className="news-time"> · {n.pubDate.replace(/\s*\+.*$/, "")}</span>}
              </div>
              <div className="news-title">{n.title}</div>
              {n.description && <div className="news-desc">{n.description}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
