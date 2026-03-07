import type { Metadata, Viewport } from "next";
import { Source_Serif_4, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
  themeColor: "#e5ecf5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
