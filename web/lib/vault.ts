import { monadTestnet } from "wagmi/chains";
import { vaultAbi } from "./vault-abi";

export const VAULT_ADDRESS = "0xe256867D01eE907c13b1cD60E42d60fA7f9268AB" as const;
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;
export const CHAIN = monadTestnet;

export const vaultContract = {
  address: VAULT_ADDRESS,
  abi: vaultAbi,
} as const;

/** Mirror of the contract's day-status codes (2-bit bitmap entries). */
export const DayStatus = {
  Unreported: 0,
  Compliant: 1,
  Violated: 2,
  Missed: 3,
} as const;

export type Commitment = {
  owner: `0x${string}`;
  rulesHash: `0x${string}`;
  stakeInitial: bigint;
  stakeRemaining: bigint;
  beneficiary: `0x${string}`;
  startTimestamp: bigint;
  durationDays: number;
  slashBps: number;
  lastReportedDay: number;
  streak: number;
  violations: number;
  active: boolean;
  dayStatuses: bigint;
};

export const SECONDS_PER_DAY = 86_400n;

export function startDayOf(c: Commitment): bigint {
  return c.startTimestamp / SECONDS_PER_DAY;
}

export function endDayOf(c: Commitment): bigint {
  return startDayOf(c) + BigInt(c.durationDays) - 1n;
}

/** Timestamp (seconds) when withdraw unlocks. */
export function unlockTimestampOf(c: Commitment): bigint {
  return c.startTimestamp + BigInt(c.durationDays) * SECONDS_PER_DAY;
}

/** Ceil-division slash preview, mirroring the contract's math. */
export function previewSlash(stakeRemaining: bigint, slashBps: number): bigint {
  if (slashBps === 0) return 0n;
  return (stakeRemaining * BigInt(slashBps) + 9_999n) / 10_000n;
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
