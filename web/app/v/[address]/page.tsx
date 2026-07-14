import type { Metadata } from "next";
import { isAddress } from "viem";
import { PublicVaultView } from "./public-view";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = isAddress(address) ? `${address.slice(0, 6)}…${address.slice(-4)}` : "unknown";
  const title = `Vaultline — ${short}'s trading accountability streak`;
  const description =
    "Staked MON against their own trading rules on Monad. Clean days build the streak; violations and missed reports burn stake. Self-reported, economically honest.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    // "summary" (not large_image): we don't generate an OG image.
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicVaultPage({ params }: Props) {
  const { address } = await params;

  if (!isAddress(address)) {
    return (
      <div className="py-24 text-center">
        <p className="font-mono text-sm text-muted-foreground">Not a valid address.</p>
      </div>
    );
  }

  return <PublicVaultView address={address} />;
}
