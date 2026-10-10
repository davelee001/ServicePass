# ServicePass TODO

## Recommended order for unfinished work

Updated October 10, 2026. **8 items remain unfinished.** Existing item numbers are retained below.

1. **Item 11 - Fix malformed landing page CSS.** Remove the stray declaration/brace and verify a warning-free CSS build.
2. **Item 10 - Correct unsupported landing page claims.** Describe the implemented full-voucher redemption flow and actual audit/deployment status.
3. **Item 12 - Validate the POS simulator.** Reject invalid amounts and amounts above the selected balance; clearly label simulated results.
4. **Item 13 - Repair Security & Audit navigation.** Add an accurate destination section or point the control to an existing section.
5. **Item 14 - Make FAQ controls keyboard accessible.** Use semantic controls with expanded state and keyboard operation.
6. **Item 3 - Finish production configuration verification.** Provision secret-manager values and verify the live configuration.
7. **Item 7 - Prove the full system on testnet.** Validate actual wallet/frontend/backend/contract flows after the integration fixes.
8. **Item 8 - Complete security and operations readiness.** Finish audit, recovery, monitoring, staged deployment and rollback verification before production.

Completed items: **1, 2, 4, 5, 6 and 9**. Hosted CI and live deployment evidence must still be checked for the relevant revision; prior local test results do not validate new changes automatically.

## Detailed checklist

- [x] **1. Make CI run the real checks — P0 · Small**
  The root `npm test` script is a placeholder, while the CI workflow runs it from the root. Update `package.json` and `automated-testing.yml` to install and run the backend suite. Fix the smart-contract workflow’s build command/path too; the Move package manifest is `Move.toml`. Require these checks to pass before deployment.

  Completed (October 7, 2026): Root CI checks now pass locally on Node.js 24: 219 backend regression tests across 15 suites, 34 configuration/sanitization checks, 3 dependency checks, 11 QR tests, an expiry check and an SDK/Jest check. Sui CLI 1.80.1 builds the pinned Move package and passes all 11 contract tests; `npm run test:move` reproduces those checks. Fixed missing dependencies, runtime API incompatibilities, database indexes/model defaults, notification dispatch and malformed/outdated tests. Both deployment workflows require backend and Move checks for the same revision. Updated changes still need pushing for a hosted GitHub run. See docs/CI_VALIDATION.md.

- [x] **2. Fix frontend-to-backend routing — P0 · Small**
  The Vite proxy targets port `5000`, but the backend uses `3000`; production Nginx also has no `/api` proxy. Choose and configure one production API URL/reverse-proxy setup across `vite.config.js`, `docker-compose.yml`, and `nginx.conf`.

  Completed (October 6, 2026): Backend remains on port 3000; Vite uses 5173 and proxies same-origin `/api` through a configurable target. Compose development routes to `backend:3000`; production Nginx preserves API paths and excludes API responses from SPA fallback/static caching. Frontend Docker builds set `/api` at build time. Proxy smoke checks passed for query strings, POST bodies, authentication headers, and error responses; frontend build and configuration checks passed. Live production-container verification remains pending because Docker Desktop is not running.

- [ ] **3. Remove insecure deployment defaults — P0 · Small**
  Don’t allow placeholder JWT, MongoDB, or other secrets in a production deployment. Supply strong secrets through a secret manager, restrict CORS to the production frontend, and verify startup fails when required production configuration is missing. Review `docker-compose.yml` and `envValidation.js`.

  Progress (October 6, 2026): Removed development Compose secret defaults and added a standalone production definition using secret-manager file inputs and authenticated TLS MongoDB/Redis connections. Startup loads secrets and validates production settings before application imports; CORS requires exact HTTPS origins. All 32 focused tests passed, including real server startup rejection, and production Compose parsing passed. Operator secret-manager provisioning and live production verification remain pending; keep this item open until those deployment steps are verified.

- [x] **4. Triage dependency vulnerabilities — P1 · Small to medium**
  npm reported **30 high-severity advisories** in the backend tree and **4 advisories** in the frontend tree. Review the audit details, update or replace affected dependencies, and rerun tests. In particular, the Sui SDK packages are deprecated; avoid unreviewed `--force` upgrades.

  Completed triage (October 7, 2026): Reviewed upgrades and a tested, scoped coverage-loader override reduced fresh backend and frontend npm audits to zero findings. Removed unused frontend Sui packages, Nodemon, and the npm crypto shim; upgraded Jest/Vite/React Router; aligned Docker with Node 22 and enabled committed lockfiles. Frontend build, proxy checks, 32 configuration tests, and coverage-loader compatibility checks passed. The backend regression suite now passes (219 tests). Backend Sui SDK migration is explicitly carried into item 5; see docs/DEPENDENCY_TRIAGE.md.

- [x] **5. Make QR redemption match the contract — P0 · Large**
  The backend call’s arguments do not match the Move function signature, and the route uses the admin keypair as a placeholder signer. A voucher is an owner-held object, so the backend admin cannot simply consume a user’s voucher. Decide whether the user signs or the app sponsors transactions, then align the API, signer flow, and contract and cover the full path with a test. See `redemptions.js` and `voucher_system.move`.

  Additional scope from dependency triage: migrate the backend from deprecated `@mysten/sui.js` to the supported SDK while aligning transaction builders, typed Move arguments, execution methods, and the chosen signer flow.

  Completed implementation (October 7, 2026): QR redemption now prepares the exact registry/merchant/owner-held voucher transaction and requires the current owner's wallet signature and gas payment. Confirmation verifies effects/events and supports idempotent recovery of the same digest. Merchant registration stores actual object IDs. Backend/frontend migrated to SDK 2 with typed arguments; backend CI/Docker use Node 24 for Jest ESM compatibility. Focused HTTP and signature tests pass with an injected ledger; actual Move execution and browser testnet validation remain item 7, and on-chain expiry/merchant enforcement remain item 6. See docs/QR_REDEMPTION.md.

- [x] **6. Correct on-chain expiry and merchant enforcement — P0 · Large**
  The contract compares `expiry_timestamp` with the Sui epoch number, while the app/tests use millisecond timestamps. Pick a consistent on-chain time source/unit. Also enforce voucher-to-merchant restrictions on-chain rather than trusting only QR payload checks.

  Completed (October 7, 2026): Minting/redemption use the immutable Sui Clock at 0x6 and Unix milliseconds; zero means no expiry and equality is expired. The contract rejects mismatched merchant IDs even for direct callers. Mint, batch/CSV, owner-signed transactions, admin form, model, frontend and analytics now follow those units. Stable Move 2024 and a pinned framework/lockfile build successfully with Sui CLI 1.80.1; all 11 Move tests, 11 focused HTTP tests, the model/frontend expiry check, and frontend build passed. Public signatures changed; a fresh coordinated testnet deployment remains item 7. See docs/ONCHAIN_EXPIRY.md.

- [ ] **7. Prove the full system on testnet — P1 · Large**
  After the integration fixes, deploy the contract to Sui testnet and exercise minting, transfer, expiry, redemption, duplicate attempts, and failure/retry behavior using the actual frontend and backend. Don’t move to mainnet until these flows pass.

- [ ] **8. Complete production security and operations readiness — P1 · Large**
  Review contract and API authorization with a security audit; protect admin signing keys; verify TLS, database/Redis backups and recovery, monitoring/alerts, and incident procedures. Then do a staged deployment with a rollback plan.


- [x] **9. Fix wallet entry and preserve existing accounts - P0 - Medium**
  Wallet entry generates a random 40-digit hex address, while the owner API requires 64 digits. Connect a real Sui wallet and use its account address; opening the dashboard must preserve the connected account instead of generating another. Cover landing-page entry and returning to an existing dashboard. See [Navigation.jsx](frontend/src/components/Navigation.jsx#L65) and [LandingPage.jsx](frontend/src/pages/LandingPage.jsx#L174).

  Completed (October 10, 2026): Both header and landing entry use a shared Wallet Standard selector with network/account validation and normalized 64-digit addresses. Dashboard entry preserves the selected account; disconnection and revoked-account events clear it. Missing wallets, rejected connections and multiple accounts have explicit UI handling. Eight automated wallet tests and four headless-browser scenarios passed with an injected Wallet Standard wallet; the frontend build passed. Live extension/testnet confirmation remains item 7. Run `npm --prefix frontend run test:wallet`.
