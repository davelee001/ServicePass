@echo off
echo Committing batch operations enhancement changes...
echo.

REM Add CSV parser utility
git add backend/src/utils/csvParser.js
git commit -m "Add CSV parser utility for batch operations"

REM Add bulk voucher minting route
git add backend/src/routes/vouchers.js
git commit -m "Add bulk voucher minting route"

REM Add CSV import for recipients route
git add backend/src/routes/redemptions.js
git commit -m "Add CSV import route for multiple recipients"

REM Add batch merchant registration route
git add backend/src/routes/merchants.js
git commit -m "Add batch merchant registration route"

REM Add frontend batch operations UI
git add frontend/src/pages/MerchantDashboard.jsx
git commit -m "Add batch operations UI to merchant dashboard"

REM Add unit tests for bulk voucher minting
git add backend/src/__tests__/vouchers.routes.test.js
git commit -m "Add unit tests for bulk voucher minting"

REM Add integration tests for batch operations
git add backend/src/__tests__/integration.test.js
git commit -m "Add integration tests for batch operations"

echo.
echo All batch operations changes committed successfully!
echo.
echo To push to GitHub, run:
echo git push origin main
echo.
pause