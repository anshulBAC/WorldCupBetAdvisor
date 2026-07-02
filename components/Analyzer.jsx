"use client";

import { useEffect, useMemo, useState } from "react";
import { MARKET_TEMPLATES } from "@/lib/markets";

const CACHE_KEY = "sgp-risk-advisor-slip-v1";
const APPETITES = [
  { id: "conservative", label: "Conservative", tone: "cons" },
  { id: "balanced", label: "Balanced", tone: "bal" },
  { id: "aggressive", label: "Aggressive", tone: "agg" },
];

// Build the initial per-market selection state from the templates.
function freshMarkets() {
  const obj = {};
  MARKET_TEMPLATES.forEach((t) => {
    obj[t.id] = {
      id: t.id,
      name: t.name,
      short: t.short,
      hint: t.hint,
      custom: !!t.custom,
      selections: t.selections.map((s) => ({
        key: s.key,
        label: s.label,
        odds: "",
        confidence: "",
      })),
    };
  });
  return obj;
}

export default function Analyzer() {
  const [budget, setBudget] = useState(100);
  const [appetite, setAppetite] = useState("balanced");
  const [matchName, setMatchName] = useState("");
  const [active, setActive] = useState(["1x2"]);
  const [markets, setMarkets] = useState(freshMarkets);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load from session cache once (cleared automatically when the tab closes).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.budget != null) setBudget(s.budget);
        if (s.appetite) setAppetite(s.appetite);
        if (s.matchName) setMatchName(s.matchName);
        if (Array.isArray(s.active) && s.active.length) setActive(s.active);
        if (s.markets) setMarkets((m) => ({ ...m, ...s.markets }));
        if (s.notes) setNotes(s.notes);
        if (s.result) setResult(s.result);
      }
    } catch (e) {
      /* ignore corrupt cache */
    }
    setHydrated(true);
  }, []);

  // Persist to session cache on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ budget, appetite, matchName, active, markets, notes, result })
      );
    } catch (e) {
      /* quota / private mode — ignore */
    }
  }, [budget, appetite, matchName, active, markets, notes, result, hydrated]);

  function toggleMarket(id) {
    setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  function setOdds(marketId, idx, value) {
    setMarkets((m) => {
      const mk = { ...m[marketId] };
      mk.selections = mk.selections.map((s, i) =>
        i === idx ? { ...s, odds: value } : s
      );
      return { ...m, [marketId]: mk };
    });
  }

  function setConfidence(marketId, idx, value) {
    setMarkets((m) => {
      const mk = { ...m[marketId] };
      mk.selections = mk.selections.map((s, i) =>
        i === idx ? { ...s, confidence: value } : s
      );
      return { ...m, [marketId]: mk };
    });
  }

  function addScoreRow(marketId, label, odds) {
    if (!label.trim() || !odds) return;
    setMarkets((m) => {
      const mk = { ...m[marketId] };
      mk.selections = [
        ...mk.selections,
        { key: "cs-" + label.trim(), label: label.trim(), odds, confidence: "" },
      ];
      return { ...m, [marketId]: mk };
    });
  }

  function removeSelection(marketId, idx) {
    setMarkets((m) => {
      const mk = { ...m[marketId] };
      mk.selections = mk.selections.filter((_, i) => i !== idx);
      return { ...m, [marketId]: mk };
    });
  }

  function resetAll() {
    setMarkets(freshMarkets());
    setActive(["1x2"]);
    setMatchName("");
    setNotes("");
    setResult(null);
    setError("");
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {}
  }

  async function analyze() {
    setError("");
    setLoading(true);
    setResult(null);
    const payload = {
      budget: Number(budget) || 100,
      appetite,
      markets: active.map((id) => markets[id]).filter(Boolean),
    };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed.");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError("Network error — could not reach the analysis service.");
    } finally {
      setLoading(false);
    }
  }

  const anyOdds = useMemo(
    () =>
      active.some((id) =>
        (markets[id]?.selections || []).some((s) => parseFloat(s.odds) > 1)
      ),
    [active, markets]
  );

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">Bet Risk Advisor</h2>
        <span className="cache-flag">
          <span className="dot" /> session-only · nothing stored
        </span>
      </div>

      <div className="disclaimer">
        <b>Reality check.</b> This tool does <b>not</b> predict winners — no tool
        can. It converts Singapore Pools' decimal odds into implied probability,
        strips out the bookmaker's built-in margin, and (if you add your own
        confidence) estimates expected value and a Kelly stake. Every market has a
        negative expected value on average — the house edge is real. Bet only what
        you can afford to lose. 18+. If gambling is a problem, call the National
        Problem Gambling Helpline <b>1800-6-668-668</b>.
      </div>

      {/* Step 1: setup */}
      <div className="panel">
        <h2><span className="step">1</span> Your stake &amp; style</h2>
        <div className="row">
          <div className="field" style={{ minWidth: 160 }}>
            <label>Match (optional)</label>
            <input
              type="text"
              placeholder="e.g. Liverpool vs Arsenal"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label>Budget (S$)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Risk appetite</label>
            <div className="seg">
              {APPETITES.map((a) => (
                <button
                  key={a.id}
                  data-tone={a.tone}
                  className={appetite === a.id ? "active" : ""}
                  onClick={() => setAppetite(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: pick markets */}
      <div className="panel">
        <h2><span className="step">2</span> Choose markets to compare</h2>
        <div className="chips">
          {MARKET_TEMPLATES.map((t) => (
            <span
              key={t.id}
              className={"chip" + (active.includes(t.id) ? " on" : "")}
              onClick={() => toggleMarket(t.id)}
            >
              {t.short}
            </span>
          ))}
        </div>

        {active.map((id) => {
          const mk = markets[id];
          if (!mk) return null;
          return (
            <div className="market" key={id}>
              <div className="market-head">
                <div>
                  <div className="market-name">{mk.name}</div>
                </div>
              </div>
              <div className="market-hint">{mk.hint}</div>
              <div className="sel-grid">
                <div className="head">Selection</div>
                <div className="head">Odds (decimal)</div>
                <div className="head conf-head">Your confidence</div>
                {mk.selections.map((s, i) => (
                  <SelectionRow
                    key={s.key + i}
                    s={s}
                    onOdds={(v) => setOdds(id, i, v)}
                    onConf={(v) => setConfidence(id, i, v)}
                    onRemove={mk.custom ? () => removeSelection(id, i) : null}
                  />
                ))}
              </div>
              {mk.custom && <AddScore onAdd={(l, o) => addScoreRow(id, l, o)} />}
            </div>
          );
        })}
        <p className="note">
          Tip: leave a selection blank to skip it. <b>Odds</b> are enough for the
          value &amp; risk breakdown. Add <b>your confidence %</b> only if you have
          a view — it unlocks expected-value and Kelly staking suggestions.
        </p>
      </div>

      {/* Step 3: notes */}
      <div className="panel">
        <h2><span className="step">3</span> News &amp; factors (optional)</h2>
        <textarea
          placeholder="Jot down anything that affects your view — injuries, suspensions, form, weather, motivation, line-up news. Then reflect it in the confidence sliders above."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="note">
          Kept only in this browser tab and wiped when you close it. The app never
          fabricates news — it's your notepad to keep your reasoning honest.
        </p>
      </div>

      <div className="actions">
        <button className="btn" onClick={analyze} disabled={loading || !anyOdds}>
          {loading ? "Analyzing…" : "Analyze my bets"}
        </button>
        <button className="btn btn-ghost" onClick={resetAll}>
          Reset
        </button>
      </div>
      {!anyOdds && (
        <p className="note">Enter decimal odds for at least one selection to analyze.</p>
      )}
      {error && <div className="errbox">{error}</div>}

      {result && <Results result={result} matchName={matchName} />}
    </div>
  );
}

function SelectionRow({ s, onOdds, onConf, onRemove }) {
  const conf = s.confidence === "" ? 0 : Number(s.confidence);
  return (
    <>
      <div className="sel-label">
        {s.label}
        {onRemove && (
          <button className="linkbtn" onClick={onRemove} title="Remove">
            ✕
          </button>
        )}
      </div>
      <input
        type="number"
        min="1.01"
        step="0.01"
        placeholder="—"
        value={s.odds}
        onChange={(e) => onOdds(e.target.value)}
      />
      <div className="conf-cell">
        <input
          type="range"
          min="0"
          max="100"
          value={conf}
          onChange={(e) => onConf(e.target.value === "0" ? "" : e.target.value)}
        />
        <span className="conf-val">{conf ? conf + "%" : "—"}</span>
      </div>
    </>
  );
}

function AddScore({ onAdd }) {
  const [label, setLabel] = useState("");
  const [odds, setOdds] = useState("");
  return (
    <div className="addscore">
      <input
        type="text"
        placeholder="Score e.g. 2-1"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <input
        type="number"
        min="1.01"
        step="0.01"
        placeholder="Odds"
        value={odds}
        onChange={(e) => setOdds(e.target.value)}
      />
      <button
        className="btn btn-ghost"
        style={{ padding: "8px 14px" }}
        onClick={() => {
          onAdd(label, odds);
          setLabel("");
          setOdds("");
        }}
      >
        + Add score
      </button>
    </div>
  );
}

function money(n) {
  return "S$" + Number(n).toFixed(2);
}

function Results({ result, matchName }) {
  const { markets, marketSummary, recommendation, stake } = result;
  const maxAlloc = recommendation
    ? Math.max(...recommendation.allocation.map((a) => a.amount), 1)
    : 1;

  return (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>
        Analysis {matchName ? "· " + matchName : ""}
      </h2>
      <p className="note" style={{ marginTop: 0 }}>
        Based on a {money(stake)} stake. Payout figures assume the full stake on
        that single selection.
      </p>

      {/* Recommendation */}
      {recommendation && (
        <div className="panel reco">
          <h2>
            <span className="step">★</span> Where your {money(stake)} works best (
            {recommendation.appetite})
          </h2>
          {recommendation.top.map((p, i) => (
            <div className="pick" key={i}>
              <div className="rank">{i + 1}</div>
              <div className="info">
                <div className="m">{p.market}</div>
                <div className="l">{p.label}</div>
              </div>
              <div className="num">
                <div className="big">@ {p.odds.toFixed(2)}</div>
                <div className="sm">
                  {p.fairProbPct}% fair chance ·{" "}
                  <span className={`risk-pill risk-${p.risk.level}`}>
                    {p.risk.label} risk
                  </span>
                  {p.userEdgePct != null && (
                    <>
                      {" "}
                      · edge{" "}
                      <span className={p.userEdgePct >= 0 ? "pos" : "neg"}>
                        {p.userEdgePct >= 0 ? "+" : ""}
                        {p.userEdgePct}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="alloc">
            <div className="note" style={{ marginTop: 4, marginBottom: 2 }}>
              Suggested split of your {money(stake)}
              {recommendation.hasConfidence
                ? " (Kelly-weighted by your confidence):"
                : " (weighted by your risk appetite):"}
            </div>
            {recommendation.allocation.map((a, i) => (
              <div className="alloc-row" key={i}>
                <span className="alloc-amt">{money(a.amount)}</span>
                <div
                  className="alloc-bar"
                  style={{ width: (a.amount / maxAlloc) * 55 + "%" }}
                />
                <span className="alloc-lbl">{a.label}</span>
              </div>
            ))}
          </div>
          {!recommendation.hasConfidence && (
            <p className="note">
              These picks are ranked by best <b>value</b> (lowest house margin) and
              a probability band matched to your risk appetite. Add your own
              confidence % on the selections to switch to true expected-value and
              Kelly staking.
            </p>
          )}
        </div>
      )}

      {/* Market value ranking */}
      {marketSummary.length > 1 && (
        <div className="panel">
          <h2>Best-value markets (lowest house edge first)</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>House margin</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {marketSummary.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.marginPct}%</td>
                    <td>
                      <span className={"badge " + m.quality.toLowerCase()}>
                        {m.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">
            Margin = how much of every dollar the bookmaker keeps as its edge.
            Lower is a fairer price for you.
          </p>
        </div>
      )}

      {/* Per-market detail */}
      {markets.map((m) => (
        <div className="result-market" key={m.id}>
          <div className="rm-head">
            <span className="name">{m.name}</span>
            {m.marginPct != null ? (
              <span className="badge good">Margin {m.marginPct}%</span>
            ) : (
              <span className="badge fair" title="Selections overlap or are incomplete, so a house margin can't be computed for this market.">
                Margin n/a
              </span>
            )}
          </div>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Selection</th>
                  <th>Odds</th>
                  <th>Fair %</th>
                  <th>Payout</th>
                  <th>Profit</th>
                  <th>Risk</th>
                  {m.selections.some((s) => s.userEV != null) && (
                    <>
                      <th>Edge</th>
                      <th>Exp. value</th>
                      <th>Kelly stake</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {m.selections.map((s) => {
                  const showUser = s.userEV != null;
                  return (
                    <tr key={s.key} className={s.key === m.bestKey ? "best" : ""}>
                      <td>
                        {s.key === m.bestKey && <span className="star">★ </span>}
                        {s.label}
                      </td>
                      <td>{s.odds.toFixed(2)}</td>
                      <td>{s.fairProbPct}%</td>
                      <td>{money(s.payout)}</td>
                      <td className="pos">+{money(s.profit)}</td>
                      <td>
                        <span className={`risk-pill risk-${s.risk.level}`}>
                          {s.risk.label}
                        </span>
                      </td>
                      {showUser && (
                        <>
                          <td className={s.userEdgePct >= 0 ? "pos" : "neg"}>
                            {s.userEdgePct >= 0 ? "+" : ""}
                            {s.userEdgePct}%
                          </td>
                          <td className={s.userEV >= 0 ? "pos" : "neg"}>
                            {s.userEV >= 0 ? "+" : ""}
                            {money(s.userEV)}
                          </td>
                          <td>{s.kellyStake > 0 ? money(s.kellyStake) : "—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
