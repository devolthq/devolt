import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { devoltKeypair, usdcMint } from "../config";

export async function ensureDevoltUsdcBalance(
	connection: Connection,
	devoltKeypair: Keypair,
	devoltUsdcAccount: PublicKey,
	usdcMint: PublicKey,
	requiredAmount: number
) {
	const balance = await connection.getTokenAccountBalance(devoltUsdcAccount);
	console.log(`DeVolt USDC Balance: ${balance.value.uiAmount} USDC`);

	const tokenScale = 10 ** 6;

	if (
		balance.value.uiAmount === null ||
		balance.value.uiAmount < requiredAmount
	) {
		const mintAmount = requiredAmount - (balance.value.uiAmount ?? 0);

		const mintAmountScaled = Math.floor(mintAmount * tokenScale);

		if (mintAmountScaled > 0) {
			console.log(
				`Minting ${mintAmount} USDC (${mintAmountScaled} micro USDC) to DeVolt's USDC Account...`
			);

			await mintTo(
				connection,
				devoltKeypair,
				usdcMint,
				devoltUsdcAccount,
				devoltKeypair.publicKey,
				mintAmountScaled
			);
			console.log("Minted additional USDC to DeVolt's account.");
		}
	}
}

export async function ensureSolBalance(
	keypair: Keypair,
	connection: anchor.web3.Connection,
	minimumSol: number = 1
) {
	const balance = await connection.getBalance(keypair.publicKey);
	console.log(
		`Current SOL balance for ${keypair.publicKey.toBase58()}: ${
			balance / anchor.web3.LAMPORTS_PER_SOL
		} SOL`
	);
	if (balance < minimumSol * anchor.web3.LAMPORTS_PER_SOL) {
		console.log(
			`Airdropping ${minimumSol} SOL to ${keypair.publicKey.toBase58()}`
		);
		const airdropSignature = await connection.requestAirdrop(
			keypair.publicKey,
			minimumSol * anchor.web3.LAMPORTS_PER_SOL
		);
		await connection.confirmTransaction(airdropSignature, "confirmed");
		console.log(`Airdrop complete for ${keypair.publicKey.toBase58()}`);
	}
}

export async function ensureBalance(
	connection: anchor.web3.Connection,
	type: "SOL" | "USDC",
	keypair: Keypair,
	account: PublicKey,
	requiredAmount: number
) {
	// if (type === "SOL") {
	// 	await ensureSolBalance(keypair, connection, requiredAmount);
	// } else if (type === "USDC") {
	// 	await ensureDevoltUsdcBalance(
	// 		connection,
	// 		keypair,
	// 		account,
	// 		usdcMint,
	// 		requiredAmount
	// 	);
	// }
}

export async function logBalances(
	connection: anchor.web3.Connection,
	pubkey: PublicKey,
	mints: PublicKey[]
) {
	for (const mint of mints) {
		const tokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			devoltKeypair,
			mint,
			pubkey
		);
		const balance = await connection.getTokenAccountBalance(
			tokenAccount.address
		);
		console.log(
			`${pubkey.toBase58()} Balance for ${mint.toBase58()}:`,
			balance.value.uiAmount
		);
	}
}
