
# QR Code Redemption System

This document outlines the architecture and workflow of the QR code-based voucher redemption system in ServicePass.

## 1. Overview

The QR code system provides a secure and user-friendly way for merchants to redeem vouchers without needing direct access to a user's wallet or private keys. The process relies on a securely signed payload embedded within the QR code.

## 2. QR Code Generation

When a new voucher is minted via the `/api/vouchers/mint` endpoint, the backend performs the following steps:

1.  **Mint Voucher On-Chain**: A new voucher is created on the Sui blockchain.
2.  **Create Payload**: A JSON payload is created containing the essential voucher details:
    - `voucherId`
    - `voucherType`
    - `amount`
    - `recipient`
    - `merchantId`
    - `expiryTimestamp`
3.  **Sign Payload**: The backend signs this payload using a HMAC-SHA256 algorithm with a secret key (`QR_SIGNING_SECRET`). This signature is crucial for verifying the authenticity of the QR code later.
4.  **Generate QR Code**: The payload and the signature are combined into a final JSON object, which is then converted into a QR code image (as a base64 data URL).
5.  **Store Off-Chain**: The voucher details, signature, and the QR code data are stored in the `vouchers` collection in MongoDB.

The user can then fetch this QR code via the `/api/vouchers/{voucherId}/qrcode` endpoint to display it on their device.

## 3. QR Code Redemption

Merchants use a scanner (e.g., in a mobile app or a web portal) to scan the user's QR code. The scanned data is then sent to the backend for redemption.

1.  **Merchant Scans QR Code**: The merchant's device reads the JSON data from the QR code.
2.  **Call Redemption Endpoint**: The merchant's application sends the full QR code payload to the `/api/redemptions/redeem-qr` endpoint. This request must be authenticated with the merchant's API key.
3.  **Backend Verification**: The backend performs several checks:
    - **API Key Verification**: Ensures the request is from a valid, registered merchant.
    - **Signature Verification**: It recalculates the HMAC signature of the received payload (excluding the signature itself) and compares it to the signature in the payload. If they don't match, the request is rejected. This prevents tampering with the voucher data.
    - **Merchant Validation**: It checks that the `merchantId` in the payload matches the ID of the merchant making the request.
    - **Redemption Status**: It queries the `redemptions` database to ensure the `voucherId` has not already been redeemed.
4.  **On-Chain Redemption**: If all checks pass, the backend constructs and executes a `redeem_voucher` transaction on the Sui blockchain using its own credentials.
5.  **Record Redemption**: Upon successful on-chain redemption, a new document is created in the `redemptions` collection to log the event and prevent double-spending.

## 4. Security Considerations

-   **Secret Key**: The `QR_SIGNING_SECRET` must be kept confidential. If compromised, an attacker could forge valid QR codes. It should be set as a secure environment variable in production.
-   **API Keys**: Merchant API keys must be protected. They grant the ability to initiate redemptions.
-   **Transport Security**: All communication with the API must be over HTTPS to protect the QR code data and API keys in transit.
-   **Replay Attacks**: The check for existing redemptions in the database prevents a valid QR code from being used more than once.

## 5. API Endpoints

-   `POST /api/vouchers/mint`: Mints a voucher and generates the QR code. (Admin only)
-   `GET /api/vouchers/{voucherId}/qrcode`: Retrieves the QR code for a specific voucher. (User token required)
-   `POST /api/redemptions/redeem-qr`: Redeems a voucher using the scanned QR code payload. (Merchant API key required)
