// Live football news, parsed from public RSS feeds (no API key required).
// World Cup items are surfaced first; general football fills the rest.
const FEEDS = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" },
  {
    url: "https://www.espn.com/espn/rss/soccer/news",
    source: "ESPN",
  },
];

const WC_KEYWORDS = [
  "world cup",
  "wc 2026",
  "wc2026",
  "fifa",
  "usa",
  "canada",
  "mexico",
  "group stage",
  "knockout",
];

function decode(str = "") {
  return str
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

function parseFeed(xml, source) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items
    .map((block) => ({
      title: tag(block, "title"),
      link: tag(block, "link"),
      description: tag(block, "description").slice(0, 220),
      pubDate: tag(block, "pubDate"),
      source,
    }))
    .filter((i) => i.title);
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, {
        next: { revalidate: 300 },
        headers: { "User-Agent": "sgp-risk-advisor" },
      });
      if (!res.ok) throw new Error(`${f.source} ${res.status}`);
      return parseFeed(await res.text(), f.source);
    })
  );

  let items = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") items = items.concat(r.value);
  });

  if (items.length === 0) {
    return Response.json(
      { error: "No news feeds could be reached right now." },
      { status: 502 }
    );
  }

  const isWC = (i) => {
    const hay = (i.title + " " + i.description).toLowerCase();
    return WC_KEYWORDS.some((k) => hay.includes(k));
  };

  // World Cup stories first, then everything else. De-dupe by title.
  const seen = new Set();
  const dedup = items.filter((i) => {
    const key = i.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const wc = dedup.filter(isWC);
  const rest = dedup.filter((i) => !isWC(i));

  return Response.json({
    updatedAt: new Date().toISOString(),
    worldCupCount: wc.length,
    items: [...wc, ...rest].slice(0, 30),
  });
}
