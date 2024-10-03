use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{calculate_usdc_amount, DeVoltEscrow, EscrowState, Type};

#[derive(Accounts)]
#[instruction(seed: u64, energy_amount: u64)]
pub struct BuyEnergy<'info> {
    #[account(mut)]
    pub devolt: Signer<'info>,
    #[account(mut)]
    pub consumer: Signer<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub volt_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub consumer_usdc_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub devolt_usdc_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub devolt_volt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = devolt,
        seeds = [b"devolt".as_ref(), consumer.key().as_ref(), &seed.to_le_bytes()],
        space = DeVoltEscrow::INIT_SPACE,
        bump
    )]
    pub devolt_escrow: Account<'info, DeVoltEscrow>,

    #[account(mut)]
    pub devolt_escrow_usdc_account: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> BuyEnergy<'info> {
    pub fn buy_energy(
        &mut self,
        seed: u64,
        energy_amount: u64,
        bumps: &BuyEnergyBumps,
    ) -> Result<()> {
        let usdc_amount = calculate_usdc_amount(&energy_amount);

        msg!("Energy amount: {}", energy_amount);
        msg!("USDC amount: {}", usdc_amount);

        self.devolt_escrow.set_inner(DeVoltEscrow {
            seed,
            bump: bumps.devolt_escrow,
            maker: self.consumer.key(),
            devolt: self.devolt.key(),
            maker_usdc_account: self.consumer_usdc_account.key(),
            devolt_usdc_account: self.devolt_escrow_usdc_account.key(),
            devolt_volt_account: self.devolt_volt_account.key(),
            usdc_mint: self.usdc_mint.key(),
            volt_mint: self.volt_mint.key(),
            volts: energy_amount,
            usdc: usdc_amount,
            transaction: Type::Buy,
            state: EscrowState::Pending,
        });

        let cpi_accounts = TransferChecked {
            from: self.consumer_usdc_account.to_account_info(),
            to: self.devolt_escrow_usdc_account.to_account_info(),
            authority: self.consumer.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        msg!(
            "Transferring USDC from consumer to escrow: {}",
            usdc_amount * 1_000_000
        );
        transfer_checked(cpi_ctx, usdc_amount * 1_000_000, self.usdc_mint.decimals)?;

        Ok(())
    }
}
