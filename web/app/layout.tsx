import type { Metadata } from "next";
import { Geist, Roboto_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteNav } from "@/components/site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monad's brand technical font — all data, labels, hashes, buttons.
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

// Display grotesk for page titles and the wordmark.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
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
      className={`dark ${geistSans.variable} ${robotoMono.variable} ${schibsted.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <SiteNav />
          <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-border/60 py-4">
            <p className="mx-auto max-w-5xl px-4 font-mono text-xs text-muted-foreground">
              vaultline · self-reported by design · your word, your stake
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
