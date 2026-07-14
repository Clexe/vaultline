# Deployments

## Monad Testnet (chain id 10143) — current

| | |
|---|---|
| Contract | `AccountabilityVault` (v2, with per-day status bitmap) |
| Address | `0xe256867D01eE907c13b1cD60E42d60fA7f9268AB` |
| Deploy tx | `0x9e3fb9d84e0c0a1610c7d2875a5e63a937d41891a970296ce810239b6fd624b0` |
| Deployer | `0xA0c31aDF4722067475f33c010b711231639e5512` (monskills agent wallet) |
| Compiler | solc 0.8.28, EVM cancun, optimizer 200 runs |
| Verification | Sourcify `exact_match` (2026-07-14) via https://sourcify-api-monad.blockvision.org/ |
| Explorer | https://testnet.monadscan.com/address/0xe256867D01eE907c13b1cD60E42d60fA7f9268AB |

### Superseded

- v1 `0x76a9DFCF0FDD92DE5C0E4B6226d8b7921A124dC4` (tx `0x7b869aaa...b4a0576`, Sourcify exact_match) —
  replaced same day: the public RPC's 100-block `eth_getLogs` cap made the event-driven
  dashboard non-viable, v2 adds the onchain day-status bitmap instead.

## Monad Mainnet (chain id 143)

_Not yet deployed — planned for Day 4 with the `vaultline-deployer` keystore._

### Day-4 mainnet runbook (run from `contracts/`, funded commands are yours)

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

Post-deploy checklist (Claude does these given the address):

1. `web/lib/vault.ts` — set `VAULT_ADDRESS` to the mainnet address and switch
   `monadTestnet` → `monad` (both `wagmi/chains` imports, here and in `lib/wagmi.ts`).
2. `.monskills` — change `chain=monad-testnet` to `chain=monad`.
3. This file + README — record address, tx hash, verification status.
4. `cd web && npx next build` — confirm clean build, then commit.
