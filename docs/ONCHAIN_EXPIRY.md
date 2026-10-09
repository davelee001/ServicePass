# On-chain expiry and merchant restrictions

## Time semantics

`Voucher.expiry_timestamp` is a Unix timestamp in **milliseconds**. Zero means no expiry. A nonzero voucher is valid only while `clock.timestamp_ms() < expiry_timestamp`; it expires at equality. Minting rejects nonzero expiry timestamps that are already reached, including seconds-based values accidentally supplied as milliseconds.

Both `mint_voucher` and `redeem_voucher` accept `clock: &sui::clock::Clock` immediately before the implicit transaction context. Callers supply the Sui system clock object `0x6` as their final explicit argument. This is an immutable shared input; wallets must not supply a mutable clock reference. Both `VoucherMinted.timestamp` and `VoucherRedeemed.timestamp` now use chain Unix milliseconds instead of an epoch number. See [Sui on-chain time](https://docs.sui.io/sui-stack/on-chain-primitives/access-time).

The mint argument order is `(admin_cap, registry, voucher_type, amount, recipient, merchant_id_bytes, expiry_ms, metadata_bytes, clock)`. Redemption uses `(registry, merchant, voucher, clock)`. Backend single mint, batch mint, CSV import, and owner-signed QR preparation supply this argument. QR preparation reads expiry against the current system clock; execution checks the then-current clock again, so a request prepared before expiry can still fail if approved later. Request TTLs use server time and are separate from voucher expiry.

The admin form, database model, frontend expiry checks, and analytics use milliseconds too. Application clocks provide display/preflight estimates; the contract decides validity. No-expiry vouchers display as active, not expired at January 1970.

## Merchant enforcement

Before updating counters or consuming the voucher, `redeem_voucher` requires `voucher.merchant_id == merchant.merchant_id` (abort code 5). It also verifies that the merchant accepts the voucher type (code 2) and that expiry has not been reached (code 4). These checks apply to direct chain calls without any QR payload or backend involvement.

The restriction is the administrator-assigned merchant ID, as represented by the existing contract fields. Administrators must keep merchant IDs unique; this change does not add a global merchant-ID registry. Owner authorization continues to come from Sui's owner-held object rules. On successful redemption the voucher is deleted and the registry/merchant counters each advance once.

## Publishing and existing data

This changes public entry-function signatures. Deploy a fresh package on **testnet** for item 7; do not assume a compatible in-place upgrade of the old package. Configure package, registry, admin capability, and merchant object IDs from that deployment together. Pending requests prepared with old transaction arguments must be finished/reconciled against the old deployment or replaced; do not silently alter signed bytes.

Existing voucher timestamps must be inventoried before migration. Millisecond values remain valid units; old seconds-based values are expired under the new semantics. Do not automatically multiply every timestamp, change signed QR payloads, or rewrite owner-held on-chain objects. Plan administrator reissuance against the replacement package and explicitly reconcile the old voucher before granting replacement value. Retain the original QR signing secret when it is still needed to verify old payloads.

`Move.toml` uses the stable Move 2024 edition and pins Sui framework source to `mainnet-v1.80.1` for reproducibility. The committed `Move.lock` resolves the testnet build environment to exact framework revisions. Struct visibility and mutable locals follow that edition. Test-only constructors and clock manipulation are excluded from published bytecode.

## Checks

The Move tests execute the actual mint/redemption functions with framework testing clocks. Cases include one millisecond before expiry, equality, after expiry, no expiry, a different merchant accepting the same type, the designated merchant rejecting the type, successful mint/owner redemption, invalid mint timestamps, and event timestamps/counters.

The repository keeps its manifest at the root and sources in `move/sources`. CI assembles that layout before running `sui move build` and `sui move test`. For a local check, assemble a scratch directory containing `Move.toml`, `Move.lock`, and `sources/` copied from `move/sources`, then pass it through `--path` to both commands with `--build-env testnet`. The official Sui CLI can download framework dependencies on first use.

Run `npm run test:redemption` for signed HTTP transactions with the immutable fourth clock input and `npm run test:expiry` for model/frontend boundary agreement. These application tests inject ledger/storage and do not replace the Move tests or actual testnet browser verification.

Verified on October 7, 2026 with official Sui CLI 1.80.1: contract build passed and all 11 Move tests passed. All 11 signed HTTP redemption tests and the model/frontend expiry check passed; frontend production build passed. Existing full backend suite failures remain item 1; actual network deployment and wallet execution remain item 7.
