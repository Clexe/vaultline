"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { CommitmentView } from "@/components/commitment-view";
import { loadRules, describeRules } from "@/lib/rules";
import { useEffect, useState } from "react";
import { shortAddress } from "@/lib/vault";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [ruleLines, setRuleLines] = useState<string[]>([]);

  useEffect(() => {
    if (!address) return;
    const rules = loadRules(address);
    setRuleLines(rules ? describeRules(rules) : []);
  }, [address]);

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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your commitment</h1>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{address}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/v/${address}`}>Public page →</Link>
        </Button>
      </div>

      {ruleLines.length > 0 && (
        <div className="rounded-md border border-border/60 p-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Your rules ({shortAddress(address)}, from local backup)
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
