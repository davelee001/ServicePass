# ServicePass TODO

- [ ] **1. Make CI run the real checks — P0 · Small**
  The root `npm test` script is a placeholder, while the CI workflow runs it from the root. Update `package.json` and `automated-testing.yml` to install and run the backend suite. Fix the smart-contract workflow’s build command/path too; the Move package manifest is `Move.toml`. Require these checks to pass before deployment.

  Progress (October 5, 2026): Root test scripts delegate to the backend; reusable CI workflows install backend dependencies on Node.js 22 and run Jest, and assemble the Move manifest and sources for Sui build/tests. Automatic and manual deployment jobs require both checks. Workflow structure validation passed. The real backend suite currently fails on existing missing dependencies, model validation, and test errors; Move execution still needs verification with Sui CLI. Keep this item open until those checks pass.

- [x] **2. Fix frontend-to-backend routing — P0 · Small**
  The Vite proxy targets port `5000`, but the backend uses `3000`; production Nginx also has no `/api` proxy. Choose and configure one production API URL/reverse-proxy setup across `vite.config.js`, `docker-compose.yml`, and `nginx.conf`.

  Completed (October 6, 2026): Backend remains on port 3000; Vite uses 5173 and proxies same-origin `/api` through a configurable target. Compose development routes to `backend:3000`; production Nginx preserves API paths and excludes API responses from SPA fallback/static caching. Frontend Docker builds set `/api` at build time. Proxy smoke checks passed for query strings, POST bodies, authentication headers, and error responses; frontend build and configuration checks passed. Live production-container verification remains pending because Docker Desktop is not running.

- [ ] **3. Remove insecure deployment defaults — P0 · Small**
  Don’t allow placeholder JWT, MongoDB, or other secrets in a production deployment. Supply strong secrets through a secret manager, restrict CORS to the production frontend, and verify startup fails when required production configuration is missing. Review `docker-compose.yml` and `envValidation.js`.

  Progress (October 6, 2026): Removed development Compose secret defaults and added a standalone production definition using secret-manager file inputs and authenticated TLS MongoDB/Redis connections. Startup loads secrets and validates production settings before application imports; CORS requires exact HTTPS origins. All 32 focused tests passed, including real server startup rejection, and production Compose parsing passed. Operator secret-manager provisioning and live production verification remain pending; keep this item open until those deployment steps are verified.

- [x] **4. Triage dependency vulnerabilities — P1 · Small to medium**
  npm reported **30 high-severity advisories** in the backend tree and **4 advisories** in the frontend tree. Review the audit details, update or replace affected dependencies, and rerun tests. In particular, the Sui SDK packages are deprecated; avoid unreviewed `--force` upgrades.

  Completed triage (October 7, 2026): Reviewed upgrades and a tested, scoped coverage-loader override reduced fresh backend and frontend npm audits to zero findings. Removed unused frontend Sui packages, Nodemon, and the npm crypto shim; upgraded Jest/Vite/React Router; aligned Docker with Node 22 and enabled committed lockfiles. Frontend build, proxy checks, 32 configuration tests, and coverage-loader compatibility checks passed. The existing backend regression suite still fails. Backend Sui SDK migration is explicitly carried into item 5; see docs/DEPENDENCY_TRIAGE.md.

- [x] **5. Make QR redemption match the contract — P0 · Large**
  The backend call’s arguments do not match the Move function signature, and the route uses the admin keypair as a placeholder signer. A voucher is an owner-held object, so the backend admin cannot simply consume a user’s voucher. Decide whether the user signs or the app sponsors transactions, then align the API, signer flow, and contract and cover the full path with a test. See `redemptions.js` and `voucher_system.move`.

  Additional scope from dependency triage: migrate the backend from deprecated `@mysten/sui.js` to the supported SDK while aligning transaction builders, typed Move arguments, execution methods, and the chosen signer flow.

  Completed implementation (October 7, 2026): QR redemption now prepares the exact registry/merchant/owner-held voucher transaction and requires the current owner's wallet signature and gas payment. Confirmation verifies effects/events and supports idempotent recovery of the same digest. Merchant registration stores actual object IDs. Backend/frontend migrated to SDK 2 with typed arguments; backend CI/Docker use Node 24 for Jest ESM compatibility. Focused HTTP and signature tests pass with an injected ledger; actual Move execution and browser testnet validation remain item 7, and on-chain expiry/merchant enforcement remain item 6. See docs/QR_REDEMPTION.md.

- [ ] **6. Correct on-chain expiry and merchant enforcement — P0 · Large**
  The contract compares `expiry_timestamp` with the Sui epoch number, while the app/tests use millisecond timestamps. Pick a consistent on-chain time source/unit. Also enforce voucher-to-merchant restrictions on-chain rather than trusting only QR payload checks.

- [ ] **7. Prove the full system on testnet — P1 · Large**
  After the integration fixes, deploy the contract to Sui testnet and exercise minting, transfer, expiry, redemption, duplicate attempts, and failure/retry behavior using the actual frontend and backend. Don’t move to mainnet until these flows pass.

- [ ] **8. Complete production security and operations readiness — P1 · Large**
  Review contract and API authorization with a security audit; protect admin signing keys; verify TLS, database/Redis backups and recovery, monitoring/alerts, and incident procedures. Then do a staged deployment with a rollback plan.
