"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { friendlyError } from "@/lib/errors";
import {
  CHAIN,
  DayStatus,
  endDayOf,
  previewSlash,
  simulateMissedSettlement,
  startDayOf,
  unlockTimestampOf,
  vaultContract,
  type Commitment,
} from "@/lib/vault";

function fmtMon(wei: bigint): string {
  const s = formatEther(wei);
  const [int, frac] = s.split(".");
  const out = frac ? `${int}.${frac.slice(0, 4)}` : int;
  // Nonzero dust must not display as zero.
  if (wei > 0n && Number(out) === 0) return "<0.0001";
  return out;
}

function dayLabel(epochDay: bigint): string {
  const d = new Date(Number(epochDay) * 86_400_000);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function CommitmentView({
  address,
  interactive,
  showRulesHash = false,
}: {
  address: `0x${string}`;
  interactive: boolean;
  showRulesHash?: boolean;
}) {
  const [violateOpen, setViolateOpen] = useState(false);
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const wrongChain = interactive && chainId !== undefined && chainId !== CHAIN.id;

  // Wall-clock seconds, kept out of render (react-hooks/purity) and refreshed
  // so the withdraw button appears without a manual reload.
  const [nowSec, setNowSec] = useState(0);
  useEffect(() => {
    const update = () => setNowSec(Math.floor(Date.now() / 1000));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      { ...vaultContract, functionName: "getCommitment", args: [address] },
      { ...vaultContract, functionName: "getDayStatuses", args: [address] },
      { ...vaultContract, functionName: "currentDay" },
    ],
    query: { refetchInterval: 30_000 },
  });

  const commitment = data?.[0]?.result as Commitment | undefined;
  const statuses = (data?.[1]?.result as readonly number[] | undefined) ?? [];
  const today = data?.[2]?.result as bigint | undefined;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });
  // A fetched receipt is not success — the tx may have reverted onchain.
  const isSuccess = receipt?.status === "success";
  const isReverted = receipt?.status === "reverted";

  // Refresh reads once a tx confirms.
  useEffect(() => {
    if (isSuccess) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading commitment…</p>;
  }

  // Reads finished but produced nothing usable: the RPC is unreachable or a
  // call failed (allowFailure leaves isError false for per-call failures).
  if (isError || !commitment || today === undefined) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-sm text-destructive">
          Couldn&apos;t reach the Monad testnet RPC. The chain state shown here may be
          unavailable right now.
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasCommitment = commitment.durationDays > 0;
  if (!hasCommitment) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">No commitment found for this address.</p>
        {interactive && (
          <Button asChild variant="outline" size="sm">
            <Link href="/">Create your commitment →</Link>
          </Button>
        )}
      </div>
    );
  }

  const startDay = startDayOf(commitment);
  const endDay = endDayOf(commitment);
  const periodOver = today > endDay;
  const reportedToday = BigInt(commitment.lastReportedDay) >= today;
  const canReport = commitment.active && !periodOver && !reportedToday;
  const canWithdraw =
    commitment.active && nowSec > 0 && BigInt(nowSec) >= unlockTimestampOf(commitment);

  const settlement = simulateMissedSettlement(commitment, today);
  const violationSlash = previewSlash(settlement.stakeAfter, commitment.slashBps);
  const totalSlashed = commitment.stakeInitial - commitment.stakeRemaining;
  const daysLeft = periodOver ? 0n : endDay - today + 1n;

  const stats: [string, string][] = [
    ["Stake remaining", `${fmtMon(commitment.stakeRemaining)} MON`],
    ["Total slashed", `${fmtMon(totalSlashed)} MON`],
    ["Current streak", `${commitment.streak}d`],
    ["Days left", `${daysLeft}`],
  ];

  function send(fn: "reportDay" | "withdraw" | "settleMissedDays", args?: unknown[]) {
    reset();
    writeContract({
      ...vaultContract,
      functionName: fn,
      args: args as never,
      chainId: CHAIN.id,
    } as never);
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="py-4">
            <CardContent className="px-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streak calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Streak calendar</CardTitle>
          <CardDescription>
            {dayLabel(startDay)} → {dayLabel(endDay)} · fixed UTC days ·{" "}
            {commitment.slashBps / 100}% slash per violation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 md:grid-cols-14">
            {Array.from({ length: commitment.durationDays }, (_, i) => {
              const day = startDay + BigInt(i);
              const status = statuses[i] ?? DayStatus.Unreported;
              const isFuture = day > today;
              const isToday = day === today;
              const unsettledMiss = !isFuture && !isToday && status === DayStatus.Unreported;
              return (
                <div
                  key={i}
                  title={`${dayLabel(day)} — ${
                    status === DayStatus.Compliant
                      ? "compliant"
                      : status === DayStatus.Violated
                        ? "violated"
                        : status === DayStatus.Missed
                          ? "missed"
                          : unsettledMiss
                            ? "missed (unsettled)"
                            : isToday
                              ? "today"
                              : "upcoming"
                  }`}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-sm font-mono text-[10px]",
                    status === DayStatus.Compliant && "bg-emerald-600/80 text-emerald-50",
                    (status === DayStatus.Violated || status === DayStatus.Missed) &&
                      "bg-red-800/80 text-red-100",
                    unsettledMiss && "border border-red-700/70 text-red-400",
                    isFuture && "bg-muted/40 text-muted-foreground",
                    isToday && status === DayStatus.Unreported && "bg-muted/60",
                    isToday && "ring-2 ring-primary"
                  )}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-600/80" />compliant</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-red-800/80" />violated / missed</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm border border-red-700/70" />missed, unsettled</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-muted/40" />upcoming</span>
          </div>
        </CardContent>
      </Card>

      {showRulesHash && (
        <p className="break-all font-mono text-xs text-muted-foreground">
          rules hash: {commitment.rulesHash}
        </p>
      )}

      {/* Actions */}
      {interactive && commitment.active && (
        <Card>
          <CardHeader>
            <CardTitle>{periodOver ? "Commitment complete" : "Report today"}</CardTitle>
            <CardDescription>
              {periodOver
                ? "The period is over. Withdraw whatever stake survived."
                : reportedToday
                  ? "Already reported today. Come back after the next UTC midnight."
                  : settlement.missedDays > 0
                    ? `${settlement.missedDays} missed day${settlement.missedDays > 1 ? "s" : ""} will be settled first, costing ${fmtMon(commitment.stakeRemaining - settlement.stakeAfter)} MON.`
                    : "One report per UTC day. Your word is the oracle."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {wrongChain && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => switchChain({ chainId: CHAIN.id })}
              >
                Wrong network — switch to Monad Testnet
              </Button>
            )}
            {!wrongChain && canReport && (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-700 text-emerald-50 hover:bg-emerald-600"
                  disabled={isPending || isConfirming}
                  onClick={() => send("reportDay", [true])}
                >
                  Compliant — I followed my rules
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isPending || isConfirming}
                  onClick={() => setViolateOpen(true)}
                >
                  Violated
                </Button>
              </div>
            )}

            {!wrongChain && canWithdraw && (
              <Button
                className="w-full"
                size="lg"
                disabled={isPending || isConfirming}
                onClick={() => send("withdraw")}
              >
                Withdraw {fmtMon(settlement.stakeAfter)} MON
                {settlement.missedDays > 0 &&
                  ` (after settling ${settlement.missedDays} missed day${settlement.missedDays > 1 ? "s" : ""})`}
              </Button>
            )}

            {periodOver && !canWithdraw && (
              <p className="text-sm text-muted-foreground">
                All {commitment.durationDays} days are complete. Withdrawal unlocks at{" "}
                <span className="font-mono text-foreground">
                  {new Date(Number(unlockTimestampOf(commitment)) * 1000).toUTCString()}
                </span>
                .
              </p>
            )}

            {(isPending || isConfirming) && (
              <p className="text-sm text-muted-foreground">
                {isPending ? "Confirm in wallet…" : "Waiting for confirmation…"}
              </p>
            )}
            {isSuccess && <p className="text-sm text-emerald-500">Transaction confirmed.</p>}
            {isReverted && (
              <p className="text-sm text-destructive">
                Transaction reverted onchain — no state was changed.
              </p>
            )}
            {writeError && (
              <p className="text-sm text-destructive">{friendlyError(writeError)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {!commitment.active && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              {commitment.stakeRemaining === 0n
                ? "This commitment ended with the stake fully slashed."
                : "This commitment is complete. Stake has been withdrawn."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Violation confirm dialog */}
      <Dialog open={violateOpen} onOpenChange={setViolateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a violation</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2">
                {settlement.missedDays > 0 && (
                  <p>
                    Settling {settlement.missedDays} missed day
                    {settlement.missedDays > 1 ? "s" : ""} first will slash{" "}
                    <span className="font-mono text-foreground">
                      {fmtMon(commitment.stakeRemaining - settlement.stakeAfter)} MON
                    </span>
                    .
                  </p>
                )}
                <p>
                  Reporting today as violated will slash{" "}
                  <span className="font-mono text-foreground">{fmtMon(violationSlash)} MON</span>{" "}
                  ({commitment.slashBps / 100}% of remaining stake) and reset your streak to
                  zero.
                </p>
                <p className="text-muted-foreground">
                  Honesty is the entire point. Confirm it, take the hit, trade better tomorrow.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViolateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setViolateOpen(false);
                send("reportDay", [false]);
              }}
            >
              Confirm violation — slash {fmtMon(violationSlash)} MON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
