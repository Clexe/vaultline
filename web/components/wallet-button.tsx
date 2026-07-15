"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { CHAIN, shortAddress } from "@/lib/vault";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    // Wagmi's typed error union omits it, but the injected connector throws
    // ProviderNotFoundError at runtime when no extension is installed.
    const noProvider = !!error && /provider not found/i.test(error.message);
    return (
      <div className="flex items-center gap-2">
        {noProvider && (
          <span className="hidden text-xs text-destructive sm:inline">
            No wallet extension found
          </span>
        )}
        <Button
          size="sm"
          className="rounded-full font-mono text-xs uppercase tracking-[0.08em]"
          title={noProvider ? "No wallet extension found" : undefined}
          onClick={() => connect({ connector: connectors[0] })}
          disabled={isPending || connectors.length === 0}
        >
          {isPending ? (
            "Connecting…"
          ) : (
            <>
              <span className="sm:hidden">{noProvider ? "No wallet" : "Connect"}</span>
              <span className="hidden sm:inline">Connect Wallet</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  if (chainId !== CHAIN.id) {
    return (
      <Button
        size="sm"
        variant="destructive"
        className="rounded-full font-mono text-xs uppercase tracking-[0.08em]"
        onClick={() => switchChain({ chainId: CHAIN.id })}
      >
        Switch to Monad Testnet
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => disconnect()} className="rounded-full font-mono">
      {shortAddress(address!)}
    </Button>
  );
}
