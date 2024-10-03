import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	getOrCreateAssociatedTokenAccount,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function getOrCreateTokenAccount(
	connection: Connection,
	payer: Keypair,
	mint: PublicKey,
	owner: PublicKey,
	allowOwnerOffCurve: boolean = false
): Promise<PublicKey> {
	console.log(`Creating or retrieving for ${owner.toBase58()}`);
	try {
		const tokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			payer,
			mint,
			owner,
			allowOwnerOffCurve
		);
		return tokenAccount.address;
	} catch (error: any) {
		console.error(
			`Failed to create or retrieve token account for ${owner.toBase58()}: ${error}`
		);
		throw error;
	}
}

export async function getOrCreateTokenAccountPDA(
	connection: Connection,
	payer: Keypair,
	mint: PublicKey,
	owner: PublicKey
): Promise<PublicKey> {
	return getOrCreateTokenAccount(connection, payer, mint, owner, true);
}

export async function initializeAccounts(
	connection: Connection,
	keypair: Keypair,
	devoltKeypair: Keypair,
	usdcMint: PublicKey,
	voltMint: PublicKey
): Promise<{
	keypairUsdcAccount: PublicKey;
	devoltUsdcAccount: PublicKey;
	devoltVoltAccount: PublicKey;
}> {
	const keypairUsdcAccount = await getOrCreateTokenAccount(
		connection,
		devoltKeypair,
		usdcMint,
		keypair.publicKey,
		false
	);

	const devoltUsdcAccount = await getOrCreateTokenAccount(
		connection,
		devoltKeypair,
		usdcMint,
		devoltKeypair.publicKey,
		false
	);

	const devoltVoltAccount = await getOrCreateTokenAccount(
		connection,
		devoltKeypair,
		voltMint,
		devoltKeypair.publicKey,
		false
	);

	return {
		keypairUsdcAccount,
		devoltUsdcAccount,
		devoltVoltAccount,
	};
}
