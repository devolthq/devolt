import {
	program,
	connection,
	devoltKeypair,
	usdcMint,
	voltMint,
} from "../config";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
	getOrCreateTokenAccount,
	getOrCreateTokenAccountPDA,
} from "../utils/accounts";
import { compressAccounts } from "../utils/compression";
import { ensureBalance, logBalances } from "../utils/balance";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { handleError } from "../utils/errorHandler";

export async function confirmBuyingService(params: {
	escrowPublicKey: string;
}) {
	try {
		const { escrowPublicKey } = params;
		console.log("confirmBuying called with params:", params);

		const escrowPubKey = new PublicKey(escrowPublicKey);
		console.log("Escrow Public Key:", escrowPubKey.toBase58());
		const escrowAccount = await program.account.deVoltEscrow.fetch(
			escrowPubKey
		);
		console.log("Escrow account for confirmBuying:", escrowAccount);
		if (!escrowAccount.state.pending) {
			throw new Error("Transaction is already confirmed.");
		}

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		const account = await program.account.deVoltEscrow.fetch(escrowPubKey);
		console.log("Fetched escrow account for confirmBuying:", account);

		const devoltUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			devoltKeypair.publicKey
		);

		const devoltVoltAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			voltMint,
			devoltKeypair.publicKey
		);

		const consumerUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			account.maker
		);

		const devoltEscrowUsdcAccount = await getOrCreateTokenAccountPDA(
			connection,
			devoltKeypair,
			usdcMint,
			escrowPubKey,
			true
		);

		await ensureBalance(
			connection,
			"USDC",
			devoltKeypair,
			devoltUsdcAccount,
			account.usdc.toNumber()
		);

		const accountsRPC = {
			devoltEscrow: escrowPubKey,
			devolt: devoltKeypair.publicKey,
			devoltUsdcAccount,
			devoltVoltAccount,
			consumerUsdcAccount,
			devoltEscrowUsdcAccount,
			tokenProgram: TOKEN_PROGRAM_ID,
			usdcMint,
			voltMint,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
		};

		console.log("Accounts for confirmBuying:", accountsRPC);

		const tx = await program.methods
			.confirmBuying()
			.accounts(accountsRPC)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmBuying:", tx);

		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return { transaction_id: tx };
	} catch (error: any) {
		return handleError(error);
	}
}
