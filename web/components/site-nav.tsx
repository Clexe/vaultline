"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "commit" },
  { href: "/dashboard", label: "desk" },
];

/* N9 edge-aligned minimal — the nav disappears into the canvas; no hairline,
   no centered link row. Wordmark hard left, everything else hard right. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold uppercase tracking-[0.1em] sm:tracking-[0.25em]"
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
