// ServicePass Voucher System
// A blockchain-based voucher system for real-world services and goods

module servicepass::voucher_system {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};

    // ===== Error Codes =====
    const EInsufficientBalance: u64 = 1;
    const EInvalidVoucherType: u64 = 2;
    const ENotAuthorized: u64 = 3;
    const EVoucherExpired: u64 = 4;
    const EWrongMerchant: u64 = 5;

    // ===== Voucher Types =====
    const EDUCATION: u8 = 1;
    const HEALTHCARE: u8 = 2;
    const TRANSPORT: u8 = 3;
    const AGRICULTURE: u8 = 4;

    // ===== Core Structures =====

    /// Admin capability for minting vouchers
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Main voucher registry
    public struct VoucherRegistry has key {
        id: UID,
        total_minted: u64,
        total_redeemed: u64,
    }

    /// Individual voucher token
    public struct Voucher has key, store {
        id: UID,
        voucher_type: u8,
        amount: u64,          // Amount in smallest unit (e.g., cents)
        issued_to: address,
        merchant_id: String,
        expiry_timestamp: u64, // Unix milliseconds; zero means no expiry.
        is_redeemed: bool,
        metadata: String,
    }

    /// Merchant registration
    public struct Merchant has key {
        id: UID,
        merchant_id: String,
        name: String,
        voucher_types_accepted: vector<u8>,
        total_redeemed: u64,
    }

    // ===== Events =====

    public struct VoucherMinted has copy, drop {
        voucher_id: address,
        voucher_type: u8,
        amount: u64,
        recipient: address,
        timestamp: u64,
    }

    public struct VoucherRedeemed has copy, drop {
        voucher_id: address,
        voucher_type: u8,
        amount: u64,
        merchant_id: String,
        timestamp: u64,
    }

    public struct MerchantRegistered has copy, drop {
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
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(is_valid_voucher_type(voucher_type), EInvalidVoucherType);
        let current_time = clock::timestamp_ms(clock);
        assert!(expiry_timestamp == 0 || expiry_timestamp > current_time, EVoucherExpired);

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
            timestamp: current_time,
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
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Validations
        assert!(!voucher.is_redeemed, EInsufficientBalance);
        assert!(voucher.expiry_timestamp == 0 || voucher.expiry_timestamp > current_time, EVoucherExpired);
        assert!(voucher.merchant_id == merchant.merchant_id, EWrongMerchant);
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
        let mut i = 0;
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

    // ===== Contract execution tests (excluded from published bytecode) =====

    #[test_only]
    fun redeem_for_testing(now_ms: u64, expiry_ms: u64, merchant_id: vector<u8>, accepted: vector<u8>) {
        let mut ctx = tx_context::dummy();
        let mut clock = clock::create_for_testing(&mut ctx);
        clock::set_for_testing(&mut clock, now_ms);
        let mut registry = VoucherRegistry { id: object::new(&mut ctx), total_minted: 1, total_redeemed: 0 };
        let mut merchant = Merchant {
            id: object::new(&mut ctx), merchant_id: string::utf8(merchant_id),
            name: string::utf8(b"Clinic"), voucher_types_accepted: accepted, total_redeemed: 0,
        };
        let voucher = Voucher {
            id: object::new(&mut ctx), voucher_type: HEALTHCARE, amount: 100,
            issued_to: @0xA, merchant_id: string::utf8(b"clinic"),
            expiry_timestamp: expiry_ms, is_redeemed: false, metadata: string::utf8(b""),
        };
        let voucher_id = object::uid_to_address(&voucher.id);
        redeem_voucher(&mut registry, &mut merchant, voucher, &clock, &mut ctx);
        assert!(registry.total_redeemed == 1 && merchant.total_redeemed == 1, 100);
        let events = event::events_by_type<VoucherRedeemed>();
        assert!(events.length() == 1, 101);
        let redeemed = &events[0];
        assert!(redeemed.timestamp == now_ms && redeemed.voucher_id == voucher_id, 102);
        assert!(redeemed.merchant_id == string::utf8(b"clinic") && redeemed.amount == 100, 103);
        let VoucherRegistry { id: registry_id, total_minted: _, total_redeemed: _ } = registry;
        let Merchant { id: merchant_object_id, merchant_id: _, name: _, voucher_types_accepted: _, total_redeemed: _ } = merchant;
        object::delete(registry_id);
        object::delete(merchant_object_id);
        clock::destroy_for_testing(clock);
    }

    #[test]
    fun redeem_one_millisecond_before_expiry() {
        redeem_for_testing(1700000000000, 1700000000001, b"clinic", vector[HEALTHCARE]);
    }

    #[test]
    #[expected_failure(abort_code = EVoucherExpired, location = Self)]
    fun reject_redemption_at_expiry() {
        redeem_for_testing(1700000000000, 1700000000000, b"clinic", vector[HEALTHCARE]);
    }

    #[test]
    #[expected_failure(abort_code = EVoucherExpired, location = Self)]
    fun reject_redemption_after_expiry() {
        redeem_for_testing(1700000000001, 1700000000000, b"clinic", vector[HEALTHCARE]);
    }

    #[test]
    fun redeem_without_expiry() {
        redeem_for_testing(1700000000000, 0, b"clinic", vector[HEALTHCARE]);
    }

    #[test]
    #[expected_failure(abort_code = EWrongMerchant, location = Self)]
    fun reject_wrong_merchant_even_when_type_is_accepted() {
        // Direct contract call; there is no QR or backend involved.
        redeem_for_testing(1700000000000, 1700000000001, b"other_clinic", vector[HEALTHCARE]);
    }

    #[test]
    #[expected_failure(abort_code = EInvalidVoucherType, location = Self)]
    fun reject_unaccepted_type_for_designated_merchant() {
        redeem_for_testing(1700000000000, 1700000000001, b"clinic", vector[EDUCATION]);
    }

    #[test_only]
    fun mint_for_testing(expiry_ms: u64) {
        let admin = @0xA;
        let owner = @0xB;
        let mut scenario = sui::test_scenario::begin(admin);
        init(scenario.ctx());
        scenario.next_tx(admin);
        let cap = scenario.take_from_sender<AdminCap>();
        let mut registry = scenario.take_shared<VoucherRegistry>();
        let mut clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&mut clock, 1700000000000);
        mint_voucher(&cap, &mut registry, HEALTHCARE, 100, owner, b"clinic", expiry_ms, b"", &clock, scenario.ctx());
        assert!(registry.total_minted == 1, 104);
        let events = event::events_by_type<VoucherMinted>();
        assert!(events.length() == 1 && events[0].timestamp == 1700000000000, 105);
        sui::test_scenario::return_shared(registry);
        scenario.return_to_sender(cap);
        clock::destroy_for_testing(clock);
        scenario.next_tx(owner);
        let voucher = scenario.take_from_sender<Voucher>();
        assert!(voucher.expiry_timestamp == expiry_ms && voucher.issued_to == owner, 106);
        // Owner-held minted voucher is consumed by the same entry point as production.
        let mut registry = scenario.take_shared<VoucherRegistry>();
        let mut merchant = Merchant {
            id: object::new(scenario.ctx()), merchant_id: string::utf8(b"clinic"),
            name: string::utf8(b"Clinic"), voucher_types_accepted: vector[HEALTHCARE], total_redeemed: 0,
        };
        let mut clock = clock::create_for_testing(scenario.ctx());
        clock::set_for_testing(&mut clock, 1700000000000);
        redeem_voucher(&mut registry, &mut merchant, voucher, &clock, scenario.ctx());
        assert!(registry.total_redeemed == 1 && merchant.total_redeemed == 1, 107);
        sui::test_scenario::return_shared(registry);
        let Merchant { id, merchant_id: _, name: _, voucher_types_accepted: _, total_redeemed: _ } = merchant;
        object::delete(id);
        clock::destroy_for_testing(clock);
        scenario.end();
    }

    #[test]
    fun mint_and_redeem_future_expiry_in_milliseconds() {
        mint_for_testing(1700000000001);
    }

    #[test]
    fun mint_and_redeem_without_expiry() {
        mint_for_testing(0);
    }

    #[test]
    #[expected_failure(abort_code = EVoucherExpired, location = Self)]
    fun reject_mint_at_expiry() {
        mint_for_testing(1700000000000);
    }

    #[test]
    #[expected_failure(abort_code = EVoucherExpired, location = Self)]
    fun reject_mint_in_past() {
        mint_for_testing(1699999999999);
    }

    #[test]
    #[expected_failure(abort_code = EVoucherExpired, location = Self)]
    fun reject_seconds_timestamp_at_mint() {
        mint_for_testing(1700000000);
    }
}
