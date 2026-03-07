import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio Pilot | Multi-Agent Stock Advisory",
  description:
    "Get a roundtable take on any stock. Warren Buffett, Peter Lynch, Ray Dalio, Benjamin Graham, and Cathie Wood debate pros and cons with real-time sentiment and performance metrics.",
  keywords: ["stocks", "investing", "AI", "sentiment", "advisory", "portfolio"],
  openGraph: {
    title: "Portfolio Pilot | Multi-Agent Stock Advisory",
    description:
      "AI financial advisors debate stocks with real-time sentiment analysis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-display antialiased min-h-screen bg-void text-slate-200">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal focus:text-void focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
