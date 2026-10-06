
Copy `.env.production.example` to an ignored `.env.production`, or supply these non-secret settings through deployment automation:

- `SECRETS_DIR`: absolute path to the manager's materialized files.
- `ALLOWED_ORIGINS`: exact HTTPS frontend origins, comma separated, without paths or trailing slashes. Wildcards, HTTP, localhost, and example hosts are rejected.
- `SUI_NETWORK`: `testnet` or `mainnet`.
- `PACKAGE_ID`, `ADMIN_CAP_ID`, `REGISTRY_ID`: actual nonzero deployed object/package IDs.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml up --build -d
```

The production file grants each secret only to the backend. MongoDB and Redis are not deployed or exposed by this file. MongoDB must use `mongodb+srv://` with TLS enabled, or `mongodb://` with `tls=true` (or `ssl=true`); TLS bypass flags are rejected. URI passwords must be percent encoded if they contain reserved characters. Database/Redis credentials must be supplied, and provider placeholders are rejected. External deployments with different authentication mechanisms need an explicitly reviewed configuration change.

## Startup and validation

Startup loads `.env`, reads supported `NAME_FILE` inputs, and validates configuration before importing modules that capture secrets or start background services. Configure either `NAME` or `NAME_FILE`; specifying both fails startup. Missing, unreadable, or empty files also fail startup. One final newline is stripped; embedded newlines are retained for PEM keys.

Production requires JWT, encryption, QR, and admin keys, authenticated TLS database/Redis URLs, explicit HTTPS CORS origins, and deployment IDs. Known placeholders, short or repetitive application secrets, and reused JWT/encryption/QR secrets are rejected. These checks cannot prove randomness: secrets must still be generated securely by the operator. Validation reports variable names and redacts connection URLs in diagnostic environment output.

Run focused checks from the repository root:

```bash
npm ci --prefix backend
npm run test:config
```

CI runs these checks before the existing backend Jest suite. The focused tests cover rejected settings, CORS origin decisions, secret file handling, and actual server startup rejection. Existing backend-suite failures and live infrastructure validation remain separate outstanding work.

For development, `docker-compose.yml` no longer supplies default database/JWT/encryption/QR secrets. Populate the blank fields in `.env.docker.example` with generated values. `MONGO_EXPRESS_PASSWORD` is required when resolving that development file, including when the admin UI profile is inactive. Local HTTP origins remain available only in development.
