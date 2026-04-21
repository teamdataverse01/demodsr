import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataVerse DSR Portal — Covenant University",
  description: "Data Subject Request Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
