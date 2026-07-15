import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vaultline — Privacy",
  description:
    "Vaultline collects nothing: no cookies, no analytics, no accounts, no backend. Your rules stay in your browser; only their hash goes onchain.",
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-base font-bold uppercase tracking-[0.02em]">
        <span aria-hidden className="mr-2 text-accent-text">{n}</span>
        {title}
      </h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent-text">
          &gt; privacy
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-[0.02em]">
          We collect nothing
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vaultline has no account system, no backend server, and no database. There is
          nowhere for it to collect your data, and it doesn&apos;t. Here is exactly what
          happens to everything.
        </p>
      </div>

      <Section n="01" title="No cookies, no tracking">
        <p>
          Vaultline sets no cookies of its own and includes no analytics, pixels, or tracking
          scripts. That is also why there is <strong className="text-foreground">no cookie
          consent banner</strong> — there is nothing to consent to. The site is served as
          static files; any cookie would come only from the hosting/CDN layer, never from
          Vaultline.
        </p>
      </Section>

      <Section n="02" title="What stays in your browser">
        <p>
          The trading rules you write are stored in your browser&apos;s{" "}
          <code className="text-foreground">localStorage</code>, keyed by your wallet address,
          so you can back them up and prove later what you committed to. This plaintext{" "}
          <strong className="text-foreground">never leaves your device</strong>. Only its
          keccak256 hash is sent onchain. Clear your browser storage and it is gone.
        </p>
      </Section>

      <Section n="03" title="What is public onchain">
        <p>
          A public blockchain is public by nature. Your wallet address, staked amount, current
          streak, violation count, and the <em>hash</em> of your rules are visible to anyone on
          Monad. The shareable{" "}
          <code className="text-foreground">/v/&lt;address&gt;</code> page just reads that
          public state — it exposes nothing that isn&apos;t already onchain. Do not put anything
          you need to keep private into a commitment.
        </p>
      </Section>

      <Section n="04" title="Your wallet">
        <p>
          Connecting your wallet shares your public address with the page so it can read your
          commitment. Transactions are signed in your wallet and go directly to the Monad RPC.
          Vaultline never sees, requests, or stores your private key.
        </p>
      </Section>

      <Section n="05" title="Hosting">
        <p>
          The app is a static site. The host may keep standard request logs (IP, timestamp) as
          part of serving any website, subject to their own policy — Vaultline itself writes no
          logs and runs no server-side code that could.
        </p>
      </Section>

      <p className="border-t border-border/60 pt-6 text-xs text-muted-foreground">
        This reflects the code as deployed; the source is open if you want to verify it.{" "}
        <Link className="text-accent-text underline" href="/terms">
          Terms &amp; Risk &rarr;
        </Link>
      </p>
    </div>
  );
}
