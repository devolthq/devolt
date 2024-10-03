use anchor_lang::prelude::*;

#[account]
pub struct DeVoltEscrow {
    pub seed: u64,
    pub bump: u8,

    pub maker: Pubkey,
    pub devolt: Pubkey,

    pub maker_usdc_account: Pubkey,
    pub devolt_usdc_account: Pubkey,
    pub devolt_volt_account: Pubkey,

    pub usdc_mint: Pubkey,
    pub volt_mint: Pubkey,

    pub volts: u64,
    pub usdc: u64,

    pub transaction: TransactionType,
    pub state: EscrowState,
}

impl DeVoltEscrow {
    pub const INIT_SPACE: usize = 8 + // Discriminator
        8 + // seed
        1 + // bump
        32 + // producer
        32 + // devolt
        32 + // producer_usdc_account
        32 + // devolt_usdc_account
        32 + // devolt_volt_account
        32 + // usdc_mint
        32 + // volt_mint
        8 + // volts
        8 + // usdc
        1 + // transaction
        1; // state
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EscrowState {
    Pending,
    Confirmed,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum TransactionType {
    Buy,
    Sell,
}
