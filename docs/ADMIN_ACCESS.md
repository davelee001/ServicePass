# Admin access

The `/admin` route checks the backend session before mounting any dashboard controls. Sign in with the administrator username and password. Wallet connection does not grant an admin role.

`POST /api/auth/admin/login` verifies an active admin account and its bcrypt password hash. Wrong-password attempts use the existing rate limiter and account lockout. The session lasts one hour in an HttpOnly, SameSite=Strict cookie; production also requires Secure. Authentication checks current database roles rather than trusting a token role claim. Sign-out clears the cookie and invalidates prior admin-session tokens. Admin API actions continue to require server-side authorization.

The requested administrator was provisioned in the isolated local development database. Credentials are not embedded in frontend code or automatically installed as production defaults.

For another database, set `MONGODB_URI`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your server environment, then run:

```sh
npm --prefix backend run create-admin
