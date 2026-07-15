import type { Metadata } from "next";
import Link from "next/link";
import { VAULT_ADDRESS } from "@/lib/vault";

export const metadata: Metadata = {
  title: "Vaultline — Terms & Risk",
  description:
    "Vaultline is experimental, unaudited, non-custodial software on Monad mainnet. Staking, slashing, and reporting are real and irreversible. No warranty; not financial or legal advice.",
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent-text">
          &gt; terms &amp; risk
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-[0.02em]">
          Read before you stake
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vaultline is a personal accountability experiment, not a financial product. Using
          it — on Monad mainnet, with real MON — means you accept everything below.
        </p>
      </div>

      <Section n="01" title="Experimental &amp; unaudited">
        <p>
          Vaultline is hackathon software. The contract ships with 55 tests and fuzzed slash
          math, but it has had <strong className="text-foreground">no independent security
          audit</strong>. Smart contracts can contain bugs that tests miss. Interact only
          with funds you are prepared to lose.
        </p>
      </Section>

      <Section n="02" title="Real funds, real slashing">
        <p>
          On mainnet the MON you stake is real. Reporting a violation — or missing a daily
          report, which settles as a violation automatically — slashes a fixed percentage of
          your remaining stake to your chosen beneficiary or the burn address. These
          transfers are <strong className="text-foreground">onchain and irreversible</strong>.
          Nobody, including the authors, can reverse or refund them.
        </p>
      </Section>

      <Section n="03" title="Self-reported by design">
        <p>
          There is no oracle. Vaultline never verifies your actual trades — you self-report,
          and you can lie. The only person that cheats is you. That is the entire point: the
          tool has teeth only to the extent you are honest with it.
        </p>
      </Section>

      <Section n="04" title="Non-custodial">
        <p>
          Vaultline never holds your keys and never takes custody of your funds. Staked MON
          is held by the{" "}
          <a
            className="text-accent-text underline"
            href={`https://monadscan.com/address/${VAULT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            AccountabilityVault contract
          </a>{" "}
          under its published, source-verified code. There is no admin key that can seize,
          pause, or return it — the rules are whatever the deployed bytecode says, nothing more.
        </p>
      </Section>

      <Section n="05" title="Not advice">
        <p>
          Nothing in Vaultline is financial, investment, tax, or legal advice. It is a
          commitment device for your own trading discipline. Decisions about your capital
          are yours alone.
        </p>
      </Section>

      <Section n="06" title="No warranty">
        <p>
          The software and contract are provided &ldquo;as is&rdquo;, without warranty of any
          kind, express or implied. To the maximum extent permitted by law, the authors are
          not liable for any loss arising from use of Vaultline, including lost stake, failed
          transactions, bugs, or network issues.
        </p>
      </Section>

      <Section n="07" title="Your responsibility">
        <p>
          You are responsible for your wallet and keys, your gas, the accuracy of your
          reports, and compliance with the laws that apply to you. Confirm every transaction
          before signing.
        </p>
      </Section>

      <p className="border-t border-border/60 pt-6 text-xs text-muted-foreground">
        This is an open-source hackathon project. For any production or third-party use,
        seek an independent smart-contract audit and your own legal review.{" "}
        <Link className="text-accent-text underline" href="/privacy">
          Privacy &rarr;
        </Link>
      </p>
    </div>
  );
}
