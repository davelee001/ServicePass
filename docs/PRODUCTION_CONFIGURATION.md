
CI runs these checks before the existing backend Jest suite. The focused tests cover rejected settings, CORS origin decisions, secret file handling, and actual server startup rejection. Existing backend-suite failures and live infrastructure validation remain separate outstanding work.

For development, `docker-compose.yml` no longer supplies default database/JWT/encryption/QR secrets. Populate the blank fields in `.env.docker.example` with generated values. `MONGO_EXPRESS_PASSWORD` is required when resolving that development file, including when the admin UI profile is inactive. Local HTTP origins remain available only in development.
