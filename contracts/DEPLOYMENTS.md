# Deployments

## Monad Mainnet (chain id 143) — LIVE

| | |
|---|---|
| Contract | `AccountabilityVault` (v2, with per-day status bitmap) |
| Address | `0x79DDB2B718329457F24fF3Cb784dF66E47E07a3E` |
| Deploy tx | `0x43fdfeb4ccab693f11380706cb704a88fd1fa6bc7845a520aa27379933a618e7` |
| Deployer | `0xd617E8FAE84Cc261eE0965da5d1AFFcb79187F82` (`vaultline-deployer` keystore) |
| Compiler | solc 0.8.28, EVM cancun, optimizer 200 runs |
| Verification | Sourcify via https://sourcify-api-monad.blockvision.org/ (job submitted 2026-07-15; confirm at the URL below) |
| Explorer | https://monadscan.com/address/0x79DDB2B718329457F24fF3Cb784dF66E47E07a3E |

The frontend (`web/lib/vault.ts`, `web/lib/wagmi.ts`) points at this address on chain 143.

## Monad Testnet (chain id 10143) — superseded by mainnet

| | |
|---|---|
| Contract | `AccountabilityVault` (v2, with per-day status bitmap) |
| Address | `0xe256867D01eE907c13b1cD60E42d60fA7f9268AB` |
| Deploy tx | `0x9e3fb9d84e0c0a1610c7d2875a5e63a937d41891a970296ce810239b6fd624b0` |
| Deployer | `0xA0c31aDF4722067475f33c010b711231639e5512` (monskills agent wallet) |
| Verification | Sourcify `exact_match` (2026-07-14) |
| Explorer | https://testnet.monadscan.com/address/0xe256867D01eE907c13b1cD60E42d60fA7f9268AB |

- v1 testnet `0x76a9DFCF0FDD92DE5C0E4B6226d8b7921A124dC4` (Sourcify exact_match) —
  replaced same day: the public RPC's 100-block `eth_getLogs` cap made the event-driven
  dashboard non-viable, v2 adds the onchain day-status bitmap instead.

### Mainnet runbook (executed 2026-07-15 — kept for reference / redeploys)

```bash
# 0. One-time: import your deployer key into a named Foundry keystore (prompts locally)
cast wallet import vaultline-deployer --interactive

# 1. Check funding (deploy cost on testnet was ~0.11 MON; keep margin)
cast balance $(cast wallet address --account vaultline-deployer) --rpc-url monad_mainnet

# 2. Deploy (prompts for keystore password)
forge create src/AccountabilityVault.sol:AccountabilityVault \
  --rpc-url monad_mainnet \
  --account vaultline-deployer \
  --broadcast

# 3. Verify (unfunded — Claude can run this given the address)
forge verify-contract <MAINNET_ADDR> src/AccountabilityVault.sol:AccountabilityVault \
  --chain 143 \
  --verifier sourcify \
  --verifier-url "https://sourcify-api-monad.blockvision.org/"

# 4. Sanity checks
cast code <MAINNET_ADDR> --rpc-url monad_mainnet | head -c 20
cast call <MAINNET_ADDR> "MAX_SLASH_BPS()(uint16)" --rpc-url monad_mainnet
```

Post-deploy checklist (done 2026-07-15):

1. ✅ `web/lib/vault.ts` — `VAULT_ADDRESS` = mainnet address, `monadTestnet` → `monad`.
2. ✅ `web/lib/wagmi.ts` — `monad` chain + `https://rpc.monad.xyz` transport.
3. ✅ user-facing "Monad Testnet" labels → "Monad".
4. ✅ `.monskills` — `chain=monad`.
5. ✅ this file + README — mainnet address recorded.
6. ✅ `cd web && npx next build` — clean, committed, pushed (Vercel auto-redeploys).
