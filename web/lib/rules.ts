import { keccak256, toBytes } from "viem";

/**
 * The rule set a trader commits to. Serialized to canonical JSON (fixed key
 * order, no whitespace) so the same rules always produce the same hash.
 * Only the keccak256 of this JSON goes onchain; the plaintext stays with the
 * trader (localStorage + manual backup).
 */
export type TradingRules = {
  version: 1;
  maxDailyLossPct: number | null;
  maxTradesPerDay: number | null;
  sessionHoursOnly: boolean;
  noRevengeTrading: boolean;
  custom: string;
};

const KEY_ORDER: (keyof TradingRules)[] = [
  "version",
  "maxDailyLossPct",
  "maxTradesPerDay",
  "sessionHoursOnly",
  "noRevengeTrading",
  "custom",
];

export function canonicalRulesJson(rules: TradingRules): string {
  const ordered: Record<string, unknown> = {};
  for (const key of KEY_ORDER) ordered[key] = rules[key];
  return JSON.stringify(ordered);
}

export function hashRules(rules: TradingRules): `0x${string}` {
  return keccak256(toBytes(canonicalRulesJson(rules)));
}

export const storageKey = (address: string) => `vaultline:rules:${address.toLowerCase()}`;

export function saveRules(address: string, rules: TradingRules): void {
  localStorage.setItem(storageKey(address), canonicalRulesJson(rules));
}

export function loadRules(address: string): TradingRules | null {
  const raw = localStorage.getItem(storageKey(address));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TradingRules;
  } catch {
    return null;
  }
}

export function describeRules(rules: TradingRules): string[] {
  const lines: string[] = [];
  if (rules.maxDailyLossPct !== null) lines.push(`Max daily loss ${rules.maxDailyLossPct}%`);
  if (rules.maxTradesPerDay !== null) lines.push(`Max ${rules.maxTradesPerDay} trades per day`);
  if (rules.sessionHoursOnly) lines.push("Session hours only");
  if (rules.noRevengeTrading) lines.push("No revenge trading after 2 consecutive losses");
  if (rules.custom.trim()) lines.push(rules.custom.trim());
  return lines;
}
