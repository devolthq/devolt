import {
	program,
	connection,
	devoltKeypair,
	usdcMint,
	voltMint,
} from "../config";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getOrCreateTokenAccount } from "../utils/accounts";
import { compressAccounts } from "../utils/compression";
import { ensureBalance, logBalances } from "../utils/balance";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { handleError } from "../utils/errorHandler";

export async function confirmSellingService(params: {
	escrowPublicKey: string;
}) {
	try {
		const { escrowPublicKey } = params;
		console.log("confirmSelling called with params:", params);

		const escrowPubKey = new PublicKey(escrowPublicKey);
		console.log("Escrow Public Key:", escrowPubKey.toBase58());
		const escrowAccount = await program.account.deVoltEscrow.fetch(
			escrowPubKey
		);
		console.log("Escrow account for confirmSelling:", escrowAccount);
		if (!escrowAccount.state.pending) {
			throw new Error("Transaction is already confirmed.");
		}

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		const account = await program.account.deVoltEscrow.fetch(escrowPubKey);
		console.log("Fetched escrow account for confirmSelling:", account);

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

		const producerUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			account.maker
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
			producerUsdcAccount,
			usdcMint,
			voltMint,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			tokenProgram: TOKEN_PROGRAM_ID,
		};

		console.log("Accounts for confirmSelling:", accountsRPC);

		const tx = await program.methods
			.confirmSelling()
			.accounts(accountsRPC)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmSelling:", tx);

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
