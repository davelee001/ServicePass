// ServicePass Voucher System
// A blockchain-based voucher system for real-world services and goods

module servicepass::voucher_system {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};

    // ===== Error Codes =====
    const EInsufficientBalance: u64 = 1;
    const EInvalidVoucherType: u64 = 2;
    const ENotAuthorized: u64 = 3;
    const EVoucherExpired: u64 = 4;

    // ===== Voucher Types =====
    const EDUCATION: u8 = 1;
    const HEALTHCARE: u8 = 2;
    const TRANSPORT: u8 = 3;
    const AGRICULTURE: u8 = 4;

    // ===== Core Structures =====

    /// Admin capability for minting vouchers
    struct AdminCap has key, store {
        id: UID,
    }

    /// Main voucher registry
    struct VoucherRegistry has key {
        id: UID,
        total_minted: u64,
        total_redeemed: u64,
    }

    /// Individual voucher token
    struct Voucher has key, store {
        id: UID,
        voucher_type: u8,
        amount: u64,          // Amount in smallest unit (e.g., cents)
        issued_to: address,
        merchant_id: String,
        expiry_timestamp: u64,
        is_redeemed: bool,
        metadata: String,
    }

    /// Merchant registration
    struct Merchant has key {
        id: UID,
        merchant_id: String,
        name: String,
        voucher_types_accepted: vector<u8>,
        total_redeemed: u64,
    }

    // ===== Events =====

    struct VoucherMinted has copy, drop {
        voucher_id: address,
        voucher_type: u8,
        amount: u64,
        recipient: address,
        timestamp: u64,
    }

    struct VoucherRedeemed has copy, drop {
        voucher_id: address,
        voucher_type: u8,
        amount: u64,
        merchant_id: String,
        timestamp: u64,
    }

    struct MerchantRegistered has copy, drop {
        merchant_id: String,
        name: String,
    }

    // ===== Initialization =====

    /// Initialize the module - creates admin capability and registry
    fun init(ctx: &mut TxContext) {
        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Create voucher registry
        let registry = VoucherRegistry {
            id: object::new(ctx),
            total_minted: 0,
            total_redeemed: 0,
        };

        // Transfer admin cap to deployer
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        
        // Share registry for public access
        transfer::share_object(registry);
    }

    // ===== Admin Functions =====

    /// Mint a new voucher (admin only)
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
    ) {
        assert!(is_valid_voucher_type(voucher_type), EInvalidVoucherType);

        let voucher = Voucher {
            id: object::new(ctx),
            voucher_type,
            amount,
            issued_to: recipient,
            merchant_id: string::utf8(merchant_id),
            expiry_timestamp,
            is_redeemed: false,
            metadata: string::utf8(metadata),
        };

        let voucher_id = object::uid_to_address(&voucher.id);

        // Update registry
        registry.total_minted = registry.total_minted + 1;

        // Emit event
        event::emit(VoucherMinted {
            voucher_id,
            voucher_type,
            amount,
            recipient,
            timestamp: tx_context::epoch(ctx),
        });

        // Transfer voucher to recipient
        transfer::transfer(voucher, recipient);
    }

    /// Register a new merchant
    public entry fun register_merchant(
        _admin_cap: &AdminCap,
        merchant_id: vector<u8>,
        name: vector<u8>,
        voucher_types_accepted: vector<u8>,
        ctx: &mut TxContext
    ) {
        let merchant_id_string = string::utf8(merchant_id);
        let name_string = string::utf8(name);

        let merchant = Merchant {
            id: object::new(ctx),
            merchant_id: merchant_id_string,
            name: name_string,
            voucher_types_accepted,
            total_redeemed: 0,
        };

        event::emit(MerchantRegistered {
            merchant_id: merchant_id_string,
            name: name_string,
        });

        transfer::share_object(merchant);
    }

    // ===== User Functions =====

    /// Redeem a voucher
    public entry fun redeem_voucher(
        registry: &mut VoucherRegistry,
        merchant: &mut Merchant,
        voucher: Voucher,
        ctx: &mut TxContext
    ) {
        let current_time = tx_context::epoch(ctx);
        
        // Validations
        assert!(!voucher.is_redeemed, EInsufficientBalance);
        assert!(voucher.expiry_timestamp > current_time, EVoucherExpired);
        assert!(merchant_accepts_voucher_type(merchant, voucher.voucher_type), EInvalidVoucherType);

        let voucher_id = object::uid_to_address(&voucher.id);
        let voucher_type = voucher.voucher_type;
        let amount = voucher.amount;
        let merchant_id = merchant.merchant_id;

        // Update registry
        registry.total_redeemed = registry.total_redeemed + 1;
        
        // Update merchant stats
        merchant.total_redeemed = merchant.total_redeemed + 1;

        // Emit redemption event
        event::emit(VoucherRedeemed {
            voucher_id,
            voucher_type,
            amount,
            merchant_id,
            timestamp: current_time,
        });

        // Burn the voucher
        let Voucher { id, voucher_type: _, amount: _, issued_to: _, merchant_id: _, expiry_timestamp: _, is_redeemed: _, metadata: _ } = voucher;
        object::delete(id);
    }

    // ===== View Functions =====

    /// Check if voucher type is valid
    fun is_valid_voucher_type(voucher_type: u8): bool {
        voucher_type == EDUCATION || 
        voucher_type == HEALTHCARE || 
        voucher_type == TRANSPORT || 
        voucher_type == AGRICULTURE
    }

    /// Check if merchant accepts voucher type
    fun merchant_accepts_voucher_type(merchant: &Merchant, voucher_type: u8): bool {
        let i = 0;
        let len = std::vector::length(&merchant.voucher_types_accepted);
        
        while (i < len) {
            if (*std::vector::borrow(&merchant.voucher_types_accepted, i) == voucher_type) {
                return true
            };
            i = i + 1;
        };
        
        false
    }

    // ===== Test Functions =====
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
