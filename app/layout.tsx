import type { Metadata, Viewport } from "next";
import { Source_Serif_4, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  title: "Gator Analyst | Multi-Agent Stock Discussion",
  description:
    "Get a roundtable discussion on any stock. AI personas of famous investors debate pros and cons with sentiment and performance metrics. Not financial advice.",
  keywords: ["stocks", "investing", "AI", "sentiment", "discussion", "portfolio"],
  openGraph: {
    title: "Gator Analyst | Multi-Agent Stock Discussion",
    description:
      "AI personas discuss stocks with sentiment data. Not financial advice.",
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
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded focus:outline-none"
          >
            Skip to main content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
