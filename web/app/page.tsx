"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BURN_ADDRESS, CHAIN, vaultContract, type Commitment } from "@/lib/vault";
import { canonicalRulesJson, hashRules, saveRules, type TradingRules } from "@/lib/rules";
import { friendlyError } from "@/lib/errors";

export default function CreatePage() {
  const { address, isConnected, chainId } = useAccount();

  // Rule inputs
  const [useMaxLoss, setUseMaxLoss] = useState(true);
  const [maxLoss, setMaxLoss] = useState("2");
  const [useMaxTrades, setUseMaxTrades] = useState(true);
  const [maxTrades, setMaxTrades] = useState("3");
  const [sessionOnly, setSessionOnly] = useState(true);
  const [noRevenge, setNoRevenge] = useState(true);
  const [custom, setCustom] = useState("");

  // Commitment inputs
  const [stake, setStake] = useState("1");
  const [duration, setDuration] = useState("14");
  const [slashPct, setSlashPct] = useState("10");
  const [beneficiary, setBeneficiary] = useState<string>(BURN_ADDRESS);

  const [copied, setCopied] = useState(false);

  const { data: existing, refetch: refetchExisting } = useReadContract({
    ...vaultContract,
    functionName: "getCommitment",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const hasActive = !!(existing as Commitment | undefined)?.active;

  const rules: TradingRules = useMemo(
    () => ({
      version: 1,
      maxDailyLossPct: useMaxLoss ? Number(maxLoss) || 0 : null,
      maxTradesPerDay: useMaxTrades ? Number(maxTrades) || 0 : null,
      sessionHoursOnly: sessionOnly,
      noRevengeTrading: noRevenge,
      custom,
    }),
    [useMaxLoss, maxLoss, useMaxTrades, maxTrades, sessionOnly, noRevenge, custom]
  );

  const rulesJson = useMemo(() => canonicalRulesJson(rules), [rules]);
  const rulesHash = useMemo(() => hashRules(rules), [rules]);

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  // A fetched receipt is not success — the tx may have reverted onchain.
  const isSuccess = receipt?.status === "success";
  const isReverted = receipt?.status === "reverted";

  // Persist the plaintext rules the moment the tx is sent, keyed by address.
  useEffect(() => {
    if (txHash && address) saveRules(address, rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash]);

  // Refresh the active-commitment read once creation confirms, so the form
  // locks itself instead of inviting a doomed second submit.
  useEffect(() => {
    if (isSuccess) refetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const durationNum = Number(duration);
  const slashNum = Number(slashPct);
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  // Plain decimal only — parseEther throws on scientific notation like "1e19".
  const stakeValid = /^\d+(\.\d+)?$/.test(stake.trim()) && Number(stake) > 0;
  const durationValid = durationNum >= 1 && durationNum <= 90 && Number.isInteger(durationNum);
  const slashValid = slashNum > 0 && slashNum <= 50;
  const beneficiaryValid =
    /^0x[0-9a-fA-F]{40}$/.test(beneficiary) && beneficiary.toLowerCase() !== ZERO_ADDRESS;
  const inputsValid = stakeValid && durationValid && slashValid && beneficiaryValid;
  const validationHint = !stakeValid
    ? "Stake must be a positive decimal number of MON."
    : !durationValid
      ? "Duration must be a whole number between 1 and 90 days."
      : !slashValid
        ? "Slash must be between 1% and 50%."
        : !beneficiaryValid
          ? "Beneficiary must be a valid, non-zero address."
          : null;

  const [localError, setLocalError] = useState<string | null>(null);

  function submit() {
    if (!inputsValid) return;
    setLocalError(null);
    reset();
    try {
      writeContract({
        ...vaultContract,
        functionName: "createCommitment",
        args: [
          rulesHash,
          durationNum,
          Math.round(slashNum * 100), // percent -> bps
          beneficiary as `0x${string}`,
        ],
        value: parseEther(stake.trim()),
        chainId: CHAIN.id,
      });
    } catch (e) {
      setLocalError(friendlyError(e));
    }
  }

  async function copyRules() {
    await navigator.clipboard.writeText(rulesJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commit to your rules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stake MON against a hashed copy of your trading rules. Every UTC day you report:
          clean days build the streak, violations and silence burn stake. No oracle — only
          your word, with consequences.
        </p>
      </div>

      {hasActive && (
        <Card className="border-accent-text/40">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm">You already have an active commitment.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trading rules</CardTitle>
          <CardDescription>
            Serialized to canonical JSON and hashed client-side — only the keccak256 goes
            onchain. Keep the plaintext; it is your proof of what you committed to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="r-loss"
              checked={useMaxLoss}
              onCheckedChange={(v) => setUseMaxLoss(v === true)}
            />
            <Label htmlFor="r-loss" className="flex-1">Max daily loss</Label>
            <div className="flex items-center gap-1">
              <Input
                className="w-20 text-right"
                type="number"
                min="0.1"
                step="0.1"
                value={maxLoss}
                onChange={(e) => setMaxLoss(e.target.value)}
                disabled={!useMaxLoss}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="r-trades"
              checked={useMaxTrades}
              onCheckedChange={(v) => setUseMaxTrades(v === true)}
            />
            <Label htmlFor="r-trades" className="flex-1">Max trades per day</Label>
            <Input
              className="w-20 text-right"
              type="number"
              min="1"
              step="1"
              value={maxTrades}
              onChange={(e) => setMaxTrades(e.target.value)}
              disabled={!useMaxTrades}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="r-session"
              checked={sessionOnly}
              onCheckedChange={(v) => setSessionOnly(v === true)}
            />
            <Label htmlFor="r-session">Session hours only</Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="r-revenge"
              checked={noRevenge}
              onCheckedChange={(v) => setNoRevenge(v === true)}
            />
            <Label htmlFor="r-revenge">No revenge trading after 2 consecutive losses</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-custom">Additional rules (free text)</Label>
            <Textarea
              id="r-custom"
              placeholder="e.g. no trades within 15 minutes of red-folder news"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rules hash (goes onchain)</Label>
              <Button size="sm" variant="ghost" onClick={copyRules}>
                {copied ? "Copied" : "Copy rules JSON"}
              </Button>
            </div>
            <p className="break-all rounded bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
              {rulesHash}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stake &amp; terms</CardTitle>
          <CardDescription>
            Violations slash the remaining stake. Missed daily reports count as violations
            automatically — going dark is not an exit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stake">Stake (MON)</Label>
              <Input
                id="stake"
                type="number"
                min="0"
                step="0.1"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="90"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slash">Slash per violation (%)</Label>
              <Input
                id="slash"
                type="number"
                min="1"
                max="50"
                step="1"
                value={slashPct}
                onChange={(e) => setSlashPct(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary">Beneficiary of slashed stake</Label>
            <Input
              id="beneficiary"
              className="font-mono text-xs"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Default is the burn address — slashed MON is destroyed. Point it at a charity
              or an accountability partner if you prefer.
            </p>
          </div>

          {validationHint && (
            <p className="text-sm text-muted-foreground">{validationHint}</p>
          )}
          {(writeError || localError) && (
            <p className="text-sm text-destructive">
              {localError ?? friendlyError(writeError)}
            </p>
          )}
          {isReverted && (
            <p className="text-sm text-destructive">
              Transaction reverted onchain — no commitment was created.
            </p>
          )}
          {isSuccess && (
            <p className="text-sm text-compliant">
              Commitment created.{" "}
              <Link className="underline" href="/dashboard">
                Go to your dashboard →
              </Link>
            </p>
          )}

          <Button
            variant="outline"
            className="w-full border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10"
            size="lg"
            disabled={!isConnected || chainId !== CHAIN.id || hasActive || !inputsValid || isPending || isConfirming}
            onClick={submit}
          >
            {!isConnected
              ? "Connect wallet to commit"
              : chainId !== CHAIN.id
                ? "Switch to Monad Testnet"
                : hasActive
                  ? "Commitment already active"
                  : isPending
                    ? "Confirm in wallet…"
                    : isConfirming
                      ? "Confirming…"
                      : `Stake ${stake || "0"} MON for ${duration || "?"} days`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
