import "./globals.css";

export const metadata = {
  title: "SGP Risk Advisor — Singapore Pools Bet Analyzer",
  description:
    "Turn Singapore Pools odds into honest math: implied probability, bookmaker margin, expected value, Kelly staking and risk ratings. Session-only, no data stored.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
