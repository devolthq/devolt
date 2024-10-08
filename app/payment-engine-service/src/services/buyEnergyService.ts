import {
	program,
	connection,
	devoltKeypair,
	usdcMint,
	voltMint,
} from "../config";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
	getOrCreateTokenAccount,
	getOrCreateTokenAccountPDA,
	initializeAccounts,
} from "../utils/accounts";
import { compressAccounts } from "../utils/compression";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { handleError } from "../utils/errorHandler";
import { ensureBalance, logBalances } from "../utils/balance";

export async function buyEnergyService(params: {
	consumerKeypairBytes: number[];
	seed: number;
	energyAmount: number;
}) {
	try {
		const { consumerKeypairBytes, seed, energyAmount } = params;
		console.log("Received params:", params);

		const consumerKeypair = Keypair.fromSecretKey(
			Uint8Array.from(consumerKeypairBytes)
		);
		const consumerPubKey = consumerKeypair.publicKey;
		const seedBN = new BN(seed);
		const energyAmountBN = new BN(energyAmount);

		const [devoltEscrowPDA] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("devolt"),
				consumerPubKey.toBuffer(),
				seedBN.toArrayLike(Buffer, "le", 8),
			],
			program.programId
		);

		console.log("Devolt Escrow PDA:", devoltEscrowPDA.toBase58());

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		await ensureBalance(
			connection,
			"SOL",
			devoltKeypair,
			devoltKeypair.publicKey,
			1
		);

		const { devoltUsdcAccount, devoltVoltAccount } =
			await initializeAccounts(
				connection,
				consumerKeypair,
				devoltKeypair,
				usdcMint,
				voltMint
			);

		const consumerUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			consumerPubKey,
			false
		);

		const devoltEscrowUsdcAccount = await getOrCreateTokenAccountPDA(
			connection,
			devoltKeypair,
			usdcMint,
			devoltEscrowPDA,
			true
		);

		const accounts = {
			devolt: devoltKeypair.publicKey,
			consumer: consumerPubKey,
			usdcMint,
			voltMint,
			consumerUsdcAccount,
			devoltUsdcAccount,
			devoltVoltAccount,
			devoltEscrow: devoltEscrowPDA,
			devoltEscrowUsdcAccount,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
		};

		console.log("Accounts for buyEnergy:", accounts);

		await ensureBalance(
            connection,
			"USDC",
			devoltKeypair,
			consumerUsdcAccount,
			energyAmount
		);

		const tx = await program.methods
			.buyEnergy(seedBN, energyAmountBN)
			.accounts(accounts)
			.signers([consumerKeypair, devoltKeypair])
			.rpc();
		console.log("Transaction ID for buyEnergy:", tx);

		await logBalances(connection, consumerPubKey, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return {
			transaction_id: tx,
			escrow_public_key: devoltEscrowPDA.toBase58(),
		};
	} catch (error: any) {
		return handleError(error);
	}
}
