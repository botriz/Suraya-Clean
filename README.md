# Suraya-Clean — blockchain and digital-world prototype

This repository contains an experimental Solidity contract suite, an in-memory JavaScript chain simulator, and an in-memory digital-world engine. It is **not a production blockchain, audited token, custody service, or deployable mainnet package**.

## Current security boundaries

The current hardening branch addresses several prototype risks:

- ARZA self-service minting is admin-gated until a verified issuance oracle exists.
- Token minting and transfers reject zero addresses.
- Balance decay is explicitly disabled until a real, independently verifiable activity oracle exists.
- Entity registration/creation is restricted to the entity owner or administrator.
- DAO voting requires at least 1 ARZA of voting balance; reputation no longer increases voting weight.
- Treasury receipts are reconciled against actual token balance deltas instead of trusting a caller-supplied amount.
- Treasury spend requests and NFT mints reject zero recipients.

These changes are targeted mitigations, not a complete smart-contract audit. The DAO still needs snapshot voting, quorum rules, proposal cancellation, and a reviewed execution/timelock model. Mission rewards need verifiable completion evidence. The simulator has no transaction signatures, persistent state, or production consensus.

## Checks

```bash
npm test
npx --yes solc@0.8.24 --bin contracts/Suraya.sol -o /tmp/suraya-contracts
```

Do not deploy these contracts or use ARZA as a real asset until an independent Solidity audit, adversarial EVM tests, economic review, key-management design, and testnet validation have been completed.
