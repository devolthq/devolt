use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{calculate_volt_tokens, DeVoltEscrow, EscrowState, TransactionType};

#[derive(Accounts)]
#[instruction(seed: u64, usdc_amount: u64)]
pub struct SellEnergy<'info> {
    #[account(mut)]
    pub devolt: Signer<'info>,
    #[account(mut)]
    pub producer: Signer<'info>,

    #[account(
        mint::authority = devolt,
        mint::decimals = 6,
        mint::token_program = token_program
    )]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mint::authority = devolt,
        mint::decimals = 6,
        mint::token_program = token_program
    )]
    pub volt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        associated_token::mint = usdc_mint,
        associated_token::authority = producer,
        associated_token::token_program = token_program
    )]
    pub producer_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        associated_token::mint = usdc_mint,
        associated_token::authority = devolt,
        associated_token::token_program = token_program
    )]
    pub devolt_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        associated_token::mint = volt_mint,
        associated_token::authority = devolt,
        associated_token::token_program = token_program
    )]
    pub devolt_volt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = devolt,
        space = DeVoltEscrow::INIT_SPACE,
        seeds = [b"devolt".as_ref(), producer.key().as_ref(), &seed.to_le_bytes()],
        bump
    )]
    pub devolt_escrow: Account<'info, DeVoltEscrow>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> SellEnergy<'info> {
    pub fn sell_energy(
        &mut self,
        seed: u64,
        usdc_amount: u64,
        bumps: &SellEnergyBumps,
    ) -> Result<()> {
        let volts_amount = calculate_volt_tokens(&usdc_amount);

        msg!("Volts amount: {}", volts_amount);
        msg!("USDC amount: {}", usdc_amount);

        self.devolt_escrow.set_inner(DeVoltEscrow {
            seed,
            bump: bumps.devolt_escrow,

            maker: self.producer.key(),
            devolt: self.devolt.key(),

            maker_usdc_account: self.producer_usdc_account.key(),
            devolt_usdc_account: self.devolt_usdc_account.key(),
            devolt_volt_account: self.devolt_volt_account.key(),

            usdc_mint: self.usdc_mint.key(),
            volt_mint: self.volt_mint.key(),

            volts: volts_amount,
            usdc: usdc_amount,

            transaction: TransactionType::Sell,
            state: EscrowState::Pending,
        });

        Ok(())
    }
}
