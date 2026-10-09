# CI validation

Use Node.js 24.9 or later and install the committed backend lockfile:

```sh
npm ci --prefix backend
npm run test:ci
npm run test:move
```

The Move command requires Sui CLI on PATH, or `SUI_BIN` set to the executable path. It copies `Move.toml`, `Move.lock`, and `move/sources` into an isolated temporary package, then builds and runs contract tests using the testnet build environment. Local validation used Sui 1.80.1. No transaction is submitted by these commands.

The backend checks cover production configuration rejection, signed-payload sanitization, dependency compatibility, QR signatures and recovery with an injected ledger, expiry boundaries, SDK/Jest compatibility, and the complete MongoDB-backed regression suite. MongoMemoryServer starts an isolated database per suite; tests await index creation and clear stored documents between cases. Tests never require production credentials.

## Repairs that made the suite runnable

Restored missing runtime dependencies and updated Sentry, SMTP, cron and metrics usage to their installed APIs. Application imports no longer start notification/batch timers or blockchain listeners; server startup and shutdown own those resources. MongoDB connections use supported options and propagate errors.

Optional merchant coordinates now omit the entire geospatial field when absent and validate supplied longitude/latitude. Removed conflicting notification indexes. Model identifiers receive UUID defaults; minted voucher balances initialize from the minted amount. Notification identifiers support both newly created and existing accounts. Bulk notification APIs explicitly dispatch callback, immediate-send and queued forms; retry and batch IDs cannot collide within a millisecond.

Regression fixtures now follow the actual schemas, authorization claims, routes and response fields. Restored malformed JavaScript source/test files. Integration tests exercise the real Express middleware and MongoDB storage, with only blockchain execution substituted. QR payloads retain exact signed bytes through sanitization and are validated by the redemption service.

A small native-fetch Elasticsearch transport replaces the legacy adapter that introduced vulnerable transitive dependencies. Scoped `gaxios@6` UUID compatibility and logging delivery/authentication have executable coverage. Fresh online backend and frontend audits report zero findings. These checks do not establish live testnet behavior or production readiness; TODO items 3, 7 and 8 cover that work.

GitHub deployment workflows require backend and Move checks for the same revision. A hosted run can verify the updated revision once these changes are pushed.
