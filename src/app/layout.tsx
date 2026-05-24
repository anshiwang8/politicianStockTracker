import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anshi's Political Stock Tracker",
  description: "Research dashboard for public politician stock disclosures and stock ranking signals."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
