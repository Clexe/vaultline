"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { CommitmentView } from "@/components/commitment-view";
import { describeRules, hashRules, storageKey, type TradingRules } from "@/lib/rules";
import { shortAddress, vaultContract, type Commitment } from "@/lib/vault";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const { data: commitment } = useReadContract({
    ...vaultContract,
    functionName: "getCommitment",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const onchainHash = (commitment as Commitment | undefined)?.rulesHash;

  // localStorage is an external store; read it the sanctioned way (SSR-safe).
  const storedJson = useSyncExternalStore(
    subscribeToStorage,
    () => (address ? localStorage.getItem(storageKey(address)) : null),
    () => null
  );

  const ruleLines = useMemo(() => {
    if (!storedJson || !onchainHash) return [];
    try {
      const rules = JSON.parse(storedJson) as TradingRules;
      // Only show the local plaintext if it matches the onchain hash — stale
      // or edited local rules must not masquerade as the commitment.
      if (hashRules(rules) !== onchainHash) return [];
      return describeRules(rules);
    } catch {
      return [];
    }
  }, [storedJson, onchainHash]);

  if (!isConnected || !address) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to see your commitment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Your commitment</h1>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{address}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={`/v/${address}`}>Public page →</Link>
        </Button>
      </div>

      {ruleLines.length > 0 && (
        <div className="rounded-md border border-border/60 p-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Your rules ({shortAddress(address)}, local backup — hash matches onchain)
          </p>
          <ul className="list-inside list-disc text-sm">
            {ruleLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <CommitmentView address={address} interactive />
    </div>
  );
}
