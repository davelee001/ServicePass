
Production requires JWT, encryption, QR, and admin keys, authenticated TLS database/Redis URLs, explicit HTTPS CORS origins, and deployment IDs. Known placeholders, short or repetitive application secrets, and reused JWT/encryption/QR secrets are rejected. These checks cannot prove randomness: secrets must still be generated securely by the operator. Validation reports variable names and redacts connection URLs in diagnostic environment output.

Run focused checks from the repository root:

```bash
npm ci --prefix backend
npm run test:config
```

CI runs these checks before the existing backend Jest suite. The focused tests cover rejected settings, CORS origin decisions, secret file handling, and actual server startup rejection. Existing backend-suite failures and live infrastructure validation remain separate outstanding work.

For development, `docker-compose.yml` no longer supplies default database/JWT/encryption/QR secrets. Populate the blank fields in `.env.docker.example` with generated values. `MONGO_EXPRESS_PASSWORD` is required when resolving that development file, including when the admin UI profile is inactive. Local HTTP origins remain available only in development.
