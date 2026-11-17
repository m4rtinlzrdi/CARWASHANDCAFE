import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASIA Car Wash & Cafe",
  description: "Fondasi website ASIA Car Wash & Cafe. Pemesanan belum tersedia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
