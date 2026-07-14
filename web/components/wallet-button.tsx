"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { CHAIN, shortAddress } from "@/lib/vault";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return (
      <Button
        size="sm"
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending || connectors.length === 0}
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  if (chainId !== CHAIN.id) {
    return (
      <Button size="sm" variant="destructive" onClick={() => switchChain({ chainId: CHAIN.id })}>
        Switch to Monad Testnet
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => disconnect()} className="font-mono">
      {shortAddress(address!)}
    </Button>
  );
}
