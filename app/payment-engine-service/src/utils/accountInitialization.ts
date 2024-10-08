import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateTokenAccount } from "./tokenAccount";

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
