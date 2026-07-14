"use client";

import { CommitmentView } from "@/components/commitment-view";
import { shortAddress } from "@/lib/vault";

export function PublicVaultView({ address }: { address: `0x${string}` }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent-text">
          public commitment record
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {shortAddress(address)}
        </h1>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{address}</p>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          This trader staked MON against a hashed copy of their own trading rules. Every
          UTC day they report compliance — violations and silence slash stake
          automatically. Nobody verifies the reports. That&apos;s the point: lying here
          only cheats themselves.
        </p>
      </div>

      <CommitmentView address={address} interactive={false} showRulesHash />
    </div>
  );
}
