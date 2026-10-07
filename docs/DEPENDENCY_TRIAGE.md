# Dependency triage - October 7, 2026

## Audit results

Fresh online npm audits of the resolved lockfiles reported:

| Dependency tree | Before | After |
|-----------------|--------|-------|
| Backend, including dev dependencies | 30 high, 5 moderate | 0 |
| Backend, production dependencies only | 0 | 0 |
| Frontend, including dev dependencies | 1 high, 3 moderate | 0 |

These counts are npm's affected-package findings, not necessarily distinct root advisories. They describe the installed dependencies as of this review and do not establish application or contract security.

An initial offline audit returned a misleading empty report. The results above were obtained using `--offline=false`. Recheck from the repository root with `npm run audit`; CI installs both lockfiles and runs the same command.

## Reviewed changes

- Jest 29 to 30.5.2, following the [Jest 30 migration guide](https://jestjs.io/docs/upgrading-to-jest30). Existing matcher usage needs no removed-alias changes. Documentation now uses `--testPathPatterns`.
- Removed Nodemon in favor of `node --watch src/server.js`, removing its vulnerable glob dependency tree without the unsafe old-version downgrade proposed by npm audit.
- Removed the npm `crypto` shim; the application uses Node's built-in crypto module.
- Vite 5 to 7.3.7 and React plugin 4 to 5.2.0. The frontend package now declares ESM, and its build passes on the new toolchain.
- React Router 6 to 7.18.4. The project uses declarative BrowserRouter/Routes APIs and React 18, both retained by this release. Frontend compilation passed; interactive browser and complete system validation remain outstanding.
- Removed unused frontend `@mysten/sui.js` and `@mysten/dapp-kit`. The frontend currently uses a simplified wallet entry flow and does not import either package; this removal does not add wallet signing.
- A scoped override upgrades only `@istanbuljs/load-nyc-config`'s `js-yaml` dependency to 4.3.2. Its consumer calls the compatible `load` API. A test exercises the actual NYC YAML loader with include/exclude/report settings. This removes the `argparse`/`sprintf-js` path behind the remaining moderate [sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), without downgrading Jest.
- Backend/frontend now require Node 22.12 or later; Docker build/runtime images and the Compose development frontend use Node 22. CI already uses Node 22.
- Removed the blanket lockfile ignore so backend and frontend lockfiles can be committed for reproducible `npm ci` installations.

No `npm audit fix --force`, broad dependency override, or vulnerable-version downgrade was used.

## Validation

- Fresh full-tree backend and frontend audits: zero findings.
- Frontend production build: passed (existing large-bundle warning remains).
- API proxy smoke checks: passed for the API root, query strings, JSON error responses, POST bodies, and authentication headers.
- Production configuration suite: 32 tests passed.
- Scoped coverage-loader compatibility test: passed.
- Full backend Jest run: failed on existing model validation errors, missing application dependencies such as Nodemailer, and server-import environment validation. It stopped when an imported server called `process.exit`; do not interpret this as a green regression suite. Item 1 remains open.

## Backend Sui SDK follow-up

Item 5 migrated backend and frontend to `@mysten/sui` 2.35.0, updated transaction builders/execution APIs, and explicitly serialized Move arguments. Backend runtime, Docker and CI now use Node 24 (minimum 24.9) so CommonJS Jest can load SDK ESM exports with VM modules enabled. The SDK/Jest and owner-signature tests pass.

The backend retains SDK 2's deprecated JSON-RPC compatibility transport for existing queries/events. Migrating transport is still necessary; see Mysten's [JSON-RPC migration guide](https://sdk.mystenlabs.com/sui/migrations/sui-2.0/json-rpc-migration). See [owner-approved QR redemption](QR_REDEMPTION.md) for the signer flow and remaining real-chain verification.
