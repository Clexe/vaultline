# Vaultline

**An onchain trading accountability vault on Monad.** Stake MON against a hashed copy of your own trading rules. Report every UTC day: clean days build a streak, violations slash a fixed percentage of your remaining stake, and going silent counts as a violation automatically. When the commitment period ends, you withdraw whatever stake your discipline earned back.

Built solo for the **Spark hackathon by BuildAnything** (July 2026).

## The problem (a personal one)

I trade XAUUSD on prop firm accounts. Prop firms don't blow you up — *you* blow you up: revenge trading after two losses, "one more trade" past your daily cap, sizing up after a red morning. Every trader has rules; almost nobody has consequences for breaking them. A paper journal has no teeth. Vaultline gives your own rules teeth, denominated in MON.

## Why self-reporting is a feature, not a bug

Vaultline deliberately has **no oracle** and verifies nothing about your actual trades. You self-report, and yes — you can lie. But the only person you'd be cheating is yourself, exactly like lying to a paper trading journal, except here honesty has economic weight. This framing is the core design decision:

- An oracle-verified system would need broker API integrations, trusted attestors, and dispute flows — a fragile surveillance machine.
- A commitment device only needs the *cost of admitting failure* to be real. The moment you must sign a transaction that burns your stake, "it was basically a clean day" stops being a rounding error and becomes a decision.
- Missed reports are violations. The one guaranteed-observable fact (silence) is enforced trustlessly onchain, and anyone can call `settleMissedDays()` on a trader who went dark.

## Architecture

```
contracts/           Foundry project
  src/AccountabilityVault.sol    single contract, no owner, no upgradability
  test/                          55 tests: unit, edge-case, reentrancy, fuzz
web/                 Next.js App Router + wagmi/viem + shadcn
  /                  create commitment (rules hashed client-side)
  /dashboard         connected trader: calendar, stats, report/withdraw
  /v/[address]       public read-only record — the shareable artifact
```

### What's onchain

- The **keccak256 hash** of your canonical rules JSON — a tamper-proof commitment to what you promised, without doxxing your strategy.
- Stake accounting, slash math (ceil division on *remaining* stake, so every violation costs at least 1 wei), streak/violation counters.
- A **per-day status bitmap** (2 bits × up to 90 days packed in one `uint192`): the entire streak calendar is readable in a single `eth_call`. This exists because the public Monad RPC caps `eth_getLogs` at a 100-block range, which makes event-replay dashboards impractical — state beats logs.
- Slashed funds go to a chosen beneficiary (default: the `0x…dEaD` burn address) with a bounded gas stipend; a reverting or gas-griefing beneficiary falls back to the burn address and can never block settlement.

### What's offchain

- The **plaintext rules** live in your browser's localStorage (keyed by address) with a copy-to-clipboard backup. Publishing the plaintext is your choice; the hash lets you prove it later.
- Nothing else. No backend, no database, no indexer.

## Deployed contracts

| Network | Chain ID | Address |
|---|---|---|
| **Monad Mainnet** (live) | 143 | [`0x79DDB2B718329457F24fF3Cb784dF66E47E07a3E`](https://monadscan.com/address/0x79DDB2B718329457F24fF3Cb784dF66E47E07a3E) — the frontend points here |
| Monad Testnet | 10143 | [`0xe256867D01eE907c13b1cD60E42d60fA7f9268AB`](https://testnet.monadscan.com/address/0xe256867D01eE907c13b1cD60E42d60fA7f9268AB) — Sourcify `exact_match` |

See [contracts/DEPLOYMENTS.md](contracts/DEPLOYMENTS.md) for tx hashes, deployers, and verification.

## Run locally

```bash
# Frontend (talks to the deployed testnet contract)
cd web
npm install
npm run dev            # http://localhost:3000
```

## Run tests

```bash
cd contracts
forge test             # 55 tests
forge test --match-path test/Fuzz.t.sol --fuzz-runs 2000
```

## Key contract functions

| Function | Notes |
|---|---|
| `createCommitment(rulesHash, durationDays, slashBps, beneficiary)` payable | 1–90 days, slash ≤ 50%, one active commitment per address |
| `reportDay(bool compliant)` | one report per fixed UTC day; missed days settle first, atomically |
| `settleMissedDays(address)` | permissionless — the vault stays honest if the owner goes dark |
| `withdraw()` | after period end; settles outstanding missed days before paying out |
| `getDayStatuses(address)` | full calendar in one call: 0 unreported / 1 compliant / 2 violated / 3 missed |

Built with [monskills](https://github.com/therealharpaljadeja/monskills). Solidity 0.8.28 · Foundry · OpenZeppelin ReentrancyGuard · Next.js · wagmi v3 · viem.
