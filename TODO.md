  npm reported **30 high-severity advisories** in the backend tree and **4 advisories** in the frontend tree. Review the audit details, update or replace affected dependencies, and rerun tests. In particular, the Sui SDK packages are deprecated; avoid unreviewed `--force` upgrades.

- [ ] **5. Make QR redemption match the contract — P0 · Large**
  The backend call’s arguments do not match the Move function signature, and the route uses the admin keypair as a placeholder signer. A voucher is an owner-held object, so the backend admin cannot simply consume a user’s voucher. Decide whether the user signs or the app sponsors transactions, then align the API, signer flow, and contract and cover the full path with a test. See `redemptions.js` and `voucher_system.move`.

- [ ] **6. Correct on-chain expiry and merchant enforcement — P0 · Large**
  The contract compares `expiry_timestamp` with the Sui epoch number, while the app/tests use millisecond timestamps. Pick a consistent on-chain time source/unit. Also enforce voucher-to-merchant restrictions on-chain rather than trusting only QR payload checks.

- [ ] **7. Prove the full system on testnet — P1 · Large**
  After the integration fixes, deploy the contract to Sui testnet and exercise minting, transfer, expiry, redemption, duplicate attempts, and failure/retry behavior using the actual frontend and backend. Don’t move to mainnet until these flows pass.

- [ ] **8. Complete production security and operations readiness — P1 · Large**
  Review contract and API authorization with a security audit; protect admin signing keys; verify TLS, database/Redis backups and recovery, monitoring/alerts, and incident procedures. Then do a staged deployment with a rollback plan.
