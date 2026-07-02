import "./globals.css";

export const metadata = {
  title: "World Cup 2026 — Bet Risk Advisor",
  description:
    "FIFA World Cup 2026 live scores, tournament tables and news, plus honest betting math for Singapore Pools odds: implied probability, bookmaker margin, expected value, Kelly staking and risk ratings. Session-only, no data stored.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
