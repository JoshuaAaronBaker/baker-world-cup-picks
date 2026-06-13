import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "World Cup Pick’ems by Baker",
  description: "Predict World Cup scores and climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
