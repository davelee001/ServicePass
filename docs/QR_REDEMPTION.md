# Owner-approved QR redemption

Item 5 uses owner-funded transactions: the current on-chain voucher owner signs and pays SUI gas. The backend admin key never signs this QR flow. Redemption consumes the entire voucher; partial redemption is not provided by this entry point.

## Merchant and owner flow

1. A merchant opens `/merchant/redeem` and supplies their API key and signed QR payload. The key stays in page memory.
2. `POST /api/redemptions/redeem-qr` with `X-API-Key` and `{ "qrPayload": "<signed JSON>" }` prepares a request. This endpoint now returns a request, not a completed redemption; integrations must adopt this breaking API change.
3. The backend validates the HMAC, merchant, current owner, contract object types, value, accepted voucher types, and application expiry. It reads registry/merchant shared versions and voucher version/digest from Sui, then builds `redeem_voucher(registry, merchant, voucher)`. `TxContext` is implicit. No amount or recipient pure arguments are sent.
4. The merchant shares `/user/redeem?intent=<requestId>`. The owner loads the request, reviews the merchant/value, connects a Wallet Standard Sui wallet, and signs the exact prepared transaction on the configured network.
5. The frontend posts `{ "transactionBytes": "<base64>", "signature": "<serialized signature>" }` to `/api/redemptions/qr-intents/<requestId>/submit`. The server verifies the owner signature and unchanged bytes, submits the transaction, and records a redemption only after successful effects and the matching `VoucherRedeemed` event.
6. `GET /api/redemptions/qr-intents/<requestId>` reports recorded confirmation. The request ID is a random 24-byte possession token; avoid exposing it in logs or sharing it beyond the parties. Submission still requires the owner's signature.

The owner needs a SUI coin with at least 0.02 SUI. The transaction gas budget is 20,000,000 MIST; actual fees may be lower. Coin selection currently uses the first returned page and requires one sufficient coin. Owners with fragmented balances may need to consolidate coins first. A transfer after QR issuance uses the current chain owner. A transfer or gas-coin change after preparation requires a fresh request.

## Retries and persistence

Requests allow new submissions for ten minutes. MongoDB retains them for one additional day to recover ambiguous submissions. Retrying reuses the same signed bytes and digest; it never creates a replacement transaction automatically. The backend checks that digest before submitting and fails closed when status cannot be determined. Already executed transactions can be recovered after the request window while the intent remains stored.

The frontend retains the signed approval in memory so a timeout can be retried without another wallet prompt. Reloading loses that approval; the same request can be reviewed and signed again. MongoDB unique voucher/digest indexes prevent duplicate redemption records. Merchant statistics reconcile monotonically from recorded counts, including retries after partial database failure. MongoDB TTL indexes and unique indexes must be enabled in deployment.

## Configuration and migration

Set `PACKAGE_ID`, `REGISTRY_ID`, `SUI_NETWORK`, and `QR_SIGNING_SECRET` consistently with the deployed contract. Frontend `VITE_SUI_NETWORK` must match the backend; Docker/Compose forwards it during build and defaults development to testnet. Production secret/config validation remains required.

Merchant registration now stores the created shared Merchant **object ID**, not the transaction digest. Existing merchant records containing digests must be repaired from the registration transaction's created objects, matching `merchant_id`, before QR redemption works. Do not replace these records with an unrelated object or register a duplicate merchant blindly.

Both applications use `@mysten/sui` 2.35.0. Backend transactions use typed Move arguments and the modern `Transaction`/`signAndExecuteTransaction` APIs. The backend deliberately retains SDK 2's JSON-RPC compatibility client for existing read/event code. JSON-RPC transport is deprecated and must be migrated to the supported transport separately; see the [Mysten migration guide](https://sdk.mystenlabs.com/sui/migrations/sui-2.0/json-rpc-migration). Backend runtime/CI requires Node 24.9 or later because CommonJS Jest loads the SDK's ESM exports with VM modules enabled.

## Verification and remaining work

Run `npm --prefix backend run test:redemption` and `npm --prefix backend run test:sdk`. The focused HTTP tests use actual transaction serialization and cryptographic owner signatures with an injected ledger and storage. They cover preparation, exact contract arguments, signer rejection, payload tampering, expiration, chain failure, duplicate recording and timeout recovery. They do not execute the Move VM, use an actual wallet, or prove real MongoDB/Sui behavior. The separate Jest smoke test verifies SDK ESM loading and transaction signatures.

Item 6 still needs the on-chain millisecond clock and merchant enforcement; the backend's checks alone cannot enforce these rules for direct contract callers. Item 7 must deploy to testnet and verify the full browser/backend/contract path, transfers, gas, expiry, duplicates, and recovery. The existing full backend suite is failing on application bootstrap, missing dependencies, and model/test issues, and Move build/tests remain unverified without Sui CLI. Production deployment remains blocked by required CI checks.
