use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        burn, transfer_checked, Burn, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::{DeVoltError, DeVoltEscrow, EscrowState};

#[derive(Accounts)]
pub struct ConfirmBuying<'info> {
    #[account(mut)]
    pub devolt: Signer<'info>,

    #[account(
        mut,
        seeds = [b"devolt".as_ref(), devolt_escrow.maker.key().as_ref(), &devolt_escrow.seed.to_le_bytes()],
        bump = devolt_escrow.bump
    )]
    pub devolt_escrow: Account<'info, DeVoltEscrow>,

    #[account(mut)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub volt_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub consumer_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub devolt_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub devolt_volt_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub devolt_escrow_usdc_account: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> ConfirmBuying<'info> {
    pub fn confirm_buying(&mut self) -> Result<()> {
        require!(
            self.devolt_escrow.state == EscrowState::Pending,
            DeVoltError::InvalidState
        );

        let devolt_volt_balance = self.devolt_volt_account.amount;
        let volts = devolt_volt_balance;
        if volts < self.devolt_escrow.volts {
            return self.refund_buying();
        }

        let burn_accounts = Burn {
            mint: self.volt_mint.to_account_info(),
            from: self.devolt_volt_account.to_account_info(),
            authority: self.devolt.to_account_info(),
        };
        let burn_ctx = CpiContext::new(self.token_program.to_account_info(), burn_accounts);
        burn(burn_ctx, volts)?;

        let transfer_accounts = TransferChecked {
            from: self.devolt_escrow_usdc_account.to_account_info(),
            to: self.devolt_usdc_account.to_account_info(),
            authority: self.devolt_escrow.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };

        let seeds = &[
            b"devolt".as_ref(),
            self.devolt_escrow.maker.as_ref(),
            &self.devolt_escrow.seed.to_le_bytes(),
            &[self.devolt_escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let transfer_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            signer_seeds,
        );

        transfer_checked(transfer_ctx, self.devolt_escrow.usdc * 1_000_000, self.usdc_mint.decimals)?;

        self.devolt_escrow.state = EscrowState::Confirmed;

        Ok(())
    }

    fn refund_buying(&mut self) -> Result<()> {
        msg!("Refunding buying");

        let cpi_accounts = TransferChecked {
            from: self.devolt_escrow_usdc_account.to_account_info(),
            to: self.consumer_usdc_account.to_account_info(),
            authority: self.devolt_escrow.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };

        let seeds = &[
            b"devolt".as_ref(),
            self.devolt_escrow.maker.as_ref(),
            &self.devolt_escrow.seed.to_le_bytes(),
            &[self.devolt_escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(cpi_ctx, self.devolt_escrow.usdc * 1_000_000, self.usdc_mint.decimals)?;

        self.devolt_escrow.state = EscrowState::Refunded;

        Err(DeVoltError::Refunded.into())
    }
}
