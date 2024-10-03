use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, TransferChecked},
};

use crate::{DeVoltError, DeVoltEscrow, EscrowState};

#[derive(Accounts)]
pub struct ConfirmSelling<'info> {
    #[account(mut)]
    pub devolt: Signer<'info>,

    #[account(
        mut,
        mint::authority = devolt,
        mint::decimals = 6,
        mint::token_program = token_program
    )]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        mut,
        mint::authority = devolt,
        mint::decimals = 6,
        mint::token_program = token_program
    )]
    pub volt_mint: Account<'info, Mint>,

    #[account(mut)]
    pub producer_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub devolt_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub devolt_volt_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"devolt".as_ref(), devolt_escrow.maker.key().as_ref(), &devolt_escrow.seed.to_le_bytes()],
        bump
    )]
    pub devolt_escrow: Account<'info, DeVoltEscrow>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ConfirmSelling<'info> {
    pub fn confirm_selling(&mut self) -> Result<()> {
        require!(
            self.devolt_escrow.state == EscrowState::Pending,
            DeVoltError::InvalidState
        );

        let devolt_usdc_balance = self.devolt_usdc_account.amount;
        if devolt_usdc_balance < self.devolt_escrow.usdc {
            return self.refund_selling();
        }

        let cpi_accounts = TransferChecked {
            mint: self.usdc_mint.to_account_info(),
            from: self.devolt_usdc_account.to_account_info(),
            to: self.producer_usdc_account.to_account_info(),
            authority: self.devolt.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer_checked(
            cpi_ctx,
            self.devolt_escrow.usdc * 1_000_000,
            self.usdc_mint.decimals,
        )?;

        let cpi_accounts = MintTo {
            mint: self.volt_mint.to_account_info(),
            to: self.devolt_volt_account.to_account_info(),
            authority: self.devolt.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::mint_to(cpi_ctx, self.devolt_escrow.volts * 1_000_000)?;

        self.devolt_escrow.state = EscrowState::Confirmed;

        Ok(())
    }

    fn refund_selling(&mut self) -> Result<()> {
        msg!("Refunding selling");

        self.devolt_escrow.state = EscrowState::Refunded;

        Err(DeVoltError::Refunded.into())
    }
}
