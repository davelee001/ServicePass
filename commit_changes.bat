@echo off
echo Committing authentication enhancement changes...
echo.

REM Add authentication dependencies
git add backend/package.json
git commit -m "Add authentication dependencies"

REM Add User model
git add backend/src/models/User.js
git commit -m "Add User model with role-based authentication"

REM Add authentication middleware
git add backend/src/middleware/auth.js
git commit -m "Add JWT authentication and authorization middleware"

REM Add rate limiting middleware
git add backend/src/middleware/rateLimiter.js
git commit -m "Add rate limiting middleware for all endpoints"

REM Add API key manager utility
git add backend/src/utils/apiKeyManager.js
git commit -m "Add API key management system for merchants"

REM Add authentication routes
git add backend/src/routes/auth.js
git commit -m "Add authentication routes (register, login, logout)"

REM Update Merchant model
git add backend/src/models/Merchant.js
git commit -m "Update Merchant model with API key fields"

REM Update server.js
git add backend/src/server.js
git commit -m "Integrate auth routes and rate limiting in server"

REM Update merchants routes
git add backend/src/routes/merchants.js
git commit -m "Protect merchant routes and add API key endpoints"

REM Update vouchers routes
git add backend/src/routes/vouchers.js
git commit -m "Protect voucher routes with authentication"

REM Update redemptions routes
git add backend/src/routes/redemptions.js
git commit -m "Protect redemption routes with auth and API keys"

REM Update environment example
git add backend/.env.example
git commit -m "Add JWT and rate limit config to env example"

REM Add admin creation script
git add scripts/createAdmin.js
git commit -m "Add admin user creation utility script"

REM Add authentication documentation
git add docs/AUTHENTICATION.md
git commit -m "Add comprehensive authentication documentation"

REM Add implementation summary
git add IMPLEMENTATION_AUTH.md
git commit -m "Add authentication implementation summary"

REM Add quick reference guide
git add AUTH_QUICK_REFERENCE.md
git commit -m "Add authentication quick reference guide"

REM Update README
git add README.md
git commit -m "Update README with authentication features"

echo.
echo All changes committed successfully!
echo.
echo To push to GitHub, run:
echo git push origin main
echo.
pause
