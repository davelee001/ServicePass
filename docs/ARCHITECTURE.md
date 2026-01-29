# Move Smart Contract Architecture

## Overview

The ServicePass smart contract is built using the Move programming language on the SUI blockchain. It implements a voucher system with the following key components:

## Core Structures

### AdminCap
```move
struct AdminCap has key, store {
    id: UID,
}
```
- **Purpose**: Capability object that grants admin privileges
- **Usage**: Required for minting vouchers and registering merchants
- **Security**: Only the contract deployer receives this capability

### VoucherRegistry
```move
struct VoucherRegistry has key {
    id: UID,
    total_minted: u64,
    total_redeemed: u64,
}
```
- **Purpose**: Global state tracking system
- **Shared Object**: Accessible by all users for transparency
- **Metrics**: Tracks total vouchers minted and redeemed

### Voucher
```move
struct Voucher has key, store {
    id: UID,
    voucher_type: u8,
    amount: u64,
    issued_to: address,
    merchant_id: String,
    expiry_timestamp: u64,
    is_redeemed: bool,
    metadata: String,
}
```
- **Purpose**: Individual voucher token
- **Ownership**: Transferable between users
- **Properties**:
  - `voucher_type`: 1=Education, 2=Healthcare, 3=Transport, 4=Agriculture
  - `amount`: Value in smallest unit
  - `expiry_timestamp`: Unix timestamp for expiry
  - `is_redeemed`: Prevents double-spending

### Merchant
```move
struct Merchant has key {
    id: UID,
    merchant_id: String,
    name: String,
    voucher_types_accepted: vector<u8>,
    total_redeemed: u64,
}
```
- **Purpose**: Merchant registration and tracking
- **Shared Object**: Publicly accessible for verification
- **Restrictions**: Only accepts specified voucher types

## Events

### VoucherMinted
```move
struct VoucherMinted has copy, drop {
    voucher_id: address,
    voucher_type: u8,
    amount: u64,
    recipient: address,
    timestamp: u64,
}
```
Emitted when a new voucher is created.

### VoucherRedeemed
```move
struct VoucherRedeemed has copy, drop {
    voucher_id: address,
    voucher_type: u8,
    amount: u64,
    merchant_id: String,
    timestamp: u64,
}
```
Emitted when a voucher is successfully redeemed.

### MerchantRegistered
```move
struct MerchantRegistered has copy, drop {
    merchant_id: String,
    name: String,
}
```
Emitted when a new merchant is registered.

## Function Overview

### Admin Functions

#### mint_voucher
```move
public entry fun mint_voucher(
    _admin_cap: &AdminCap,
    registry: &mut VoucherRegistry,
    voucher_type: u8,
    amount: u64,
    recipient: address,
    merchant_id: vector<u8>,
    expiry_timestamp: u64,
    metadata: vector<u8>,
    ctx: &mut TxContext
)
```
- **Access**: Admin only (requires AdminCap)
- **Purpose**: Create and distribute vouchers
- **Validation**: Checks voucher type validity
- **Side Effects**: 
  - Increments registry counter
  - Emits VoucherMinted event
  - Transfers voucher to recipient

#### register_merchant
```move
public entry fun register_merchant(
    _admin_cap: &AdminCap,
    merchant_id: vector<u8>,
    name: vector<u8>,
    voucher_types_accepted: vector<u8>,
    ctx: &mut TxContext
)
```
- **Access**: Admin only
- **Purpose**: Register service providers
- **Side Effects**:
  - Creates shared Merchant object
  - Emits MerchantRegistered event

### User Functions

#### redeem_voucher
```move
public entry fun redeem_voucher(
    registry: &mut VoucherRegistry,
    merchant: &mut Merchant,
    voucher: Voucher,
    ctx: &mut TxContext
)
```
- **Access**: Public
- **Validations**:
  - Voucher not already redeemed
  - Voucher not expired
  - Merchant accepts voucher type
- **Side Effects**:
  - Updates registry counter
  - Updates merchant stats
  - Emits VoucherRedeemed event
  - Burns (deletes) the voucher

## Security Features

### 1. Capability-Based Access Control
- Only AdminCap holder can mint vouchers
- Prevents unauthorized token creation

### 2. Voucher Expiry
- Each voucher has expiry timestamp
- Expired vouchers cannot be redeemed

### 3. Burn on Redemption
- Vouchers are destroyed upon redemption
- Prevents double-spending

### 4. Type Validation
- Merchants can only accept specific voucher types
- Ensures vouchers are used for intended purposes

### 5. Immutable Audit Trail
- All actions emit events
- Blockchain stores permanent history

## Design Decisions

### Why Struct with `key, store` vs Coin?

We use custom structs instead of SUI's native Coin framework because:

1. **Rich Metadata**: Need to store voucher type, merchant ID, expiry, etc.
2. **Controlled Redemption**: Specific merchants, not arbitrary transfers
3. **Expiry Logic**: Native coins don't support expiration
4. **Type Restrictions**: Different voucher types for different services

### Why Shared Objects?

- **VoucherRegistry**: Needs global read access for statistics
- **Merchant**: Needs to be accessible by any user during redemption

### Why Burn Instead of Mark as Used?

Burning provides:
- Clear finality
- Reduced storage costs
- Prevents accidental re-use
- Cleaner on-chain state

## Gas Considerations

### Estimated Gas Costs (Testnet)

- **mint_voucher**: ~0.001 SUI
- **register_merchant**: ~0.0015 SUI
- **redeem_voucher**: ~0.0012 SUI

### Optimization Strategies

1. **Event Data**: Store minimal data in events
2. **Metadata**: Use String for flexible metadata (can be empty)
3. **Shared Objects**: Only VoucherRegistry and Merchant are shared

## Upgrade Strategy

The contract uses `edition = "2024.beta"` which supports:
- Module upgrades via package upgrades
- Maintain AdminCap for version control
- Event schema should remain backward compatible

### Future Enhancements

1. **Batch Minting**: Mint multiple vouchers in one transaction
2. **Partial Redemption**: Redeem part of voucher value
3. **Transfer Restrictions**: Optional non-transferable vouchers
4. **Refund Mechanism**: Allow admin to burn and refund
5. **Multi-Sig Admin**: Require multiple signatures for sensitive operations

## Testing

The contract includes `#[test_only]` functions:

```move
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
```

Use SUI's testing framework:
```bash
sui move test
```

## Integration with Backend

The backend integrates via:

1. **@mysten/sui.js**: JavaScript SDK for SUI
2. **TransactionBlock**: Construct Move calls
3. **Event Listening**: Monitor blockchain events
4. **Object Queries**: Fetch vouchers and merchants

See [API_REFERENCE.md](API_REFERENCE.md) for backend integration details.
