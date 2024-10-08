import {
	program,
	connection,
	devoltKeypair,
	usdcMint,
	voltMint,
} from "../config";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { initializeAccounts } from "../utils/accounts";
import { compressAccounts } from "../utils/compression";
import { ensureBalance, logBalances } from "../utils/balance";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { handleError } from "../utils/errorHandler";
import { BN } from "@coral-xyz/anchor";

export async function sellEnergyService(params: {
	producerKeypairBytes: number[];
	seed: number;
	usdcAmount: number;
}) {
	try {
		const { producerKeypairBytes, seed, usdcAmount } = params;
		console.log("Received params:", params);

		if (producerKeypairBytes.length !== 64) {
			throw new Error("Invalid secret key size. Expected 64 bytes.");
		}

		const producerKeypair = Keypair.fromSecretKey(
			Uint8Array.from(producerKeypairBytes)
		);
		const producerPubKey = producerKeypair.publicKey;
		const seedBN = new BN(seed);
		const usdcAmountBN = new BN(usdcAmount);

		console.log("Producer Public Key:", producerPubKey.toBase58());

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		const [devoltEscrowPDA] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("devolt"),
				producerPubKey.toBuffer(),
				seedBN.toArrayLike(Buffer, "le", 8),
			],
			program.programId
		);

		console.log("Devolt Escrow PDA:", devoltEscrowPDA.toBase58());

		await ensureBalance(
			connection,
			"SOL",
			devoltKeypair,
			devoltKeypair.publicKey,
			1
		);
		await ensureBalance(
			connection,
			"SOL",
			producerKeypair,
			producerPubKey,
			1
		);

		const { devoltUsdcAccount, devoltVoltAccount } =
			await initializeAccounts(
				connection,
				producerKeypair,
				devoltKeypair,
				usdcMint,
				voltMint
			);

		const accounts = {
			devolt: devoltKeypair.publicKey,
			producer: producerPubKey,
			usdcMint,
			voltMint,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			devoltUsdcAccount,
			devoltVoltAccount,
			devoltEscrow: devoltEscrowPDA,
		};

		console.log("Accounts:", accounts);

		await ensureBalance(
			connection,
			"USDC",
			devoltKeypair,
			devoltUsdcAccount,
			usdcAmount
		);

		const tx = await program.methods
			.sellEnergy(seedBN, usdcAmountBN)
			.accountsPartial(accounts)
			.signers([producerKeypair, devoltKeypair])
			.rpc();
		console.log("Transaction ID:", tx);

		await logBalances(connection, producerPubKey, [usdcMint]);
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
