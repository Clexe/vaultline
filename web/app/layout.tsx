import type { Metadata } from "next";
import { Geist, Roboto_Mono, Silkscreen } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteNav } from "@/components/site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monad's brand technical font — data, labels, hashes, buttons.
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Pixel display face (rev 2.1) — wordmark, headings, the streak hero. The
// CRT register from the user's reference; data stays in Roboto Mono.
const silkscreen = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Vaultline — onchain trading accountability",
  description:
    "Stake MON against your own trading rules. Clean days build streaks; violations burn stake. Self-reported, economically honest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${robotoMono.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <SiteNav />
          <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="py-6">
            <p className="mx-auto max-w-5xl px-4 font-mono text-xs tracking-[0.08em] text-muted-foreground">
              <span aria-hidden className="text-accent-text">&gt; </span>
              vaultline · self-reported by design · your word, your stake
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
