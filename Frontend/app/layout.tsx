import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/tokens.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Aarohan (आरोहण) | Land Acquisition Management Platform",
  description:
    "Centralized, GIS-enabled, role-based land acquisition management platform for national infrastructure projects (SIH 2026 - Problem SIH26016).",
  keywords: [
    "Aarohan",
    "Land Acquisition",
    "GIS",
    "ULPIN",
    "Bhuvan",
    "RFCTLARR",
    "SIH 2026",
    "Smart India Hackathon",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aarohan",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f4f1ea] text-[#171716] font-sans antialiased selection:bg-[#ef5b2a]/20 selection:text-[#ef5b2a]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
