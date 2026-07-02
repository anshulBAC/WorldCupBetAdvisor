"use client";

import { useEffect, useState } from "react";
import Analyzer from "@/components/Analyzer";
import Scores from "@/components/Scores";
import News from "@/components/News";
import Tournament from "@/components/Tournament";

const TABS = [
  { id: "scores", label: "Live Scores", icon: "⚽" },
  { id: "tournament", label: "Tournament", icon: "🏆" },
  { id: "news", label: "News", icon: "📰" },
  { id: "analyzer", label: "Bet Advisor", icon: "📊" },
];

const TAB_KEY = "wc26-active-tab";

export default function Home() {
  const [tab, setTab] = useState("scores");

  // Remember the active tab for this session only.
  useEffect(() => {
    try {
      const t = sessionStorage.getItem(TAB_KEY);
      if (t && TABS.some((x) => x.id === t)) setTab(t);
    } catch (e) {}
  }, []);
  function switchTab(id) {
    setTab(id);
    try {
      sessionStorage.setItem(TAB_KEY, id);
    } catch (e) {}
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="hero-stripes" aria-hidden="true">
          <span className="stripe s-green" />
          <span className="stripe s-red" />
          <span className="stripe s-blue" />
        </div>
        <div className="topbar">
          <div className="logo wc">26</div>
          <div>
            <h1 className="title">
              World Cup 2026 <span className="title-dim">· Bet Risk Advisor</span>
            </h1>
            <p className="subtitle">
              USA · Canada · México — live scores, tournament tables, news &amp;
              honest betting math for Singapore Pools odds.
            </p>
          </div>
        </div>

        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"tab" + (tab === t.id ? " on" : "")}
              onClick={() => switchTab(t.id)}
            >
              <span className="tab-ico" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "scores" && <Scores />}
        {tab === "tournament" && <Tournament />}
        {tab === "news" && <News />}
        {tab === "analyzer" && <Analyzer />}
      </main>

      <div className="footer">
        World Cup 2026 Bet Risk Advisor · educational tool, not financial or
        betting advice · not affiliated with FIFA or Singapore Pools.
        <br />
        Scores &amp; tables: TheSportsDB · News: BBC Sport / ESPN RSS · Analyzer
        data is session-only and wiped when the tab closes.
      </div>
    </div>
  );
}
