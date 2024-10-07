use anchor_lang::prelude::*;

pub mod state;
pub use state::*;
pub mod contexts;
pub use contexts::*;

declare_id!("ESuw654Qfojyf1U14TATKTBtTc23vkdyREcD2FNuHJXT");

#[program]
pub mod payment_engine {
    use super::*;

    pub fn sell_energy(ctx: Context<SellEnergy>, seed: u64, usdc_amount: u64) -> Result<()> {
        ctx.accounts.sell_energy(seed, usdc_amount, &ctx.bumps)
    }

    pub fn confirm_selling(ctx: Context<ConfirmSelling>) -> Result<()> {
        ctx.accounts.confirm_selling()
    }

    pub fn buy_energy(ctx: Context<BuyEnergy>, seed: u64, energy_amount: u64) -> Result<()> {
        ctx.accounts.buy_energy(seed, energy_amount, &ctx.bumps)
    }

    pub fn confirm_buying(ctx: Context<ConfirmBuying>) -> Result<()> {
        ctx.accounts.confirm_buying()
    }
}

pub fn calculate_volt_tokens(usdc_amount: &u64) -> u64 {
    usdc_amount * 100
}
pub fn calculate_usdc_amount(volt_tokens: &u64) -> u64 {
    volt_tokens / 100
}

#[error_code]
pub enum DeVoltError {
    #[msg("Invalid state")]
    InvalidState,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Transaction refunded")]
    Refunded,
}
