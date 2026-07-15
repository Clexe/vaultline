"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "commit" },
  { href: "/dashboard", label: "desk" },
];

/* Floating pill nav (rev 2) — rounded container over the canvas, glowing
   wordmark; links stay edge-aligned right, mono uppercase. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="pt-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-border/70 bg-card/60 px-4 backdrop-blur sm:px-6">
        <Link
          href="/"
          className="phosphor-text font-heading text-base font-bold uppercase tracking-[0.05em] sm:tracking-[0.12em]"
        >
          <span aria-hidden className="mr-1.5 text-primary">▮</span>
          Vaultline
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.href && "text-accent-text"
              )}
            >
              {l.label}
            </Link>
          ))}
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
