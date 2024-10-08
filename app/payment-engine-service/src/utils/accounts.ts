import * as anchor from "@coral-xyz/anchor";
import {
	Connection,
	Keypair,
	PublicKey,
	sendAndConfirmTransaction,
	Transaction,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
	defaultTestStateTreeAccounts,
	LightSystemProgram,
} from "@lightprotocol/stateless.js";

const accountCache: {
	[pubkey: string]: {
		[mint: string]: PublicKey;
	};
} = {
	prozjgfrKQP59jGSXJkNKNSVFKCZNnS7FRqAt7dnvpA: {
		"6tUsS6DoCVNgo6eyfChcg2MLHds5HnqoH7NYo6JMXSB9": new PublicKey(
			"GFZouUVacbJDiY5AWugTo6umJYxcs67t9mynsRwZk6En"
		),
	},
	admDPuh7ALjfpNr7pupdL7KE7ZCwW8iRuExWFrvZZkX: {
		"6tUsS6DoCVNgo6eyfChcg2MLHds5HnqoH7NYo6JMXSB9": new PublicKey(
			"9jWU3om63MQTQagBxwGWvkABcZjt4MjiURsuKdCcaLif"
		),
		GG41daTaQcELJcfGDaVRsFVjZ6W6Wb5WEqCNH4RAgcPP: new PublicKey(
			"2EupzBSBe22CA3oPGr7SC7o9GXDkAN3ia7sHw5sZrcrV"
		),
	},
};

export async function getOrCreateTokenAccount(
	connection: Connection,
	payer: Keypair,
	mint: PublicKey,
	owner: PublicKey,
	allowOwnerOffCurve: boolean = false
): Promise<PublicKey> {
	const ownerKey = owner.toBase58();
	const mintKey = mint.toBase58();

	if (accountCache[ownerKey] && accountCache[ownerKey][mintKey]) {
		console.log(
			`Returning cached token account for ${ownerKey} with mint ${mintKey}`
		);
		return accountCache[ownerKey][mintKey];
	}

	console.log(
		`Creating or retrieving token account for ${ownerKey} with mint ${mintKey}`
	);
	try {
		const tokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			payer,
			mint,
			owner,
			allowOwnerOffCurve
		);
		console.log(
			`Successfully created or retrieved token account: ${tokenAccount.address.toBase58()}`
		);

		// Armazena no cache
		if (!accountCache[ownerKey]) {
			accountCache[ownerKey] = {};
		}
		accountCache[ownerKey][mintKey] = tokenAccount.address;

		return tokenAccount.address;
	} catch (error: any) {
		console.error(
			`Failed to create or retrieve token account for ${ownerKey} with mint ${mintKey}: ${error.message}`
		);
		throw error;
	}
}

export async function getOrCreateTokenAccountPDA(
	connection: Connection,
	payer: Keypair,
	mint: PublicKey,
	owner: PublicKey,
	allowOwnerOffCurve: boolean = false
): Promise<PublicKey> {
	return getOrCreateTokenAccount(
		connection,
		payer,
		mint,
		owner,
		allowOwnerOffCurve
	);
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

export async function ensureDevoltUsdcBalance(
	connection: anchor.web3.Connection,
	devoltKeypair: Keypair,
	devoltUsdcAccount: PublicKey,
	usdcMint: PublicKey,
	requiredAmount: number // Valor necessário em USDC
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

export async function retryGetOrCreateTokenAccount(
	connection: Connection,
	payer: Keypair,
	mint: PublicKey,
	owner: PublicKey,
	allowOwnerOffCurve: boolean = false,
	retries: number = 3,
	delay: number = 5000
): Promise<PublicKey> {
	let attempts = 0;
	while (attempts < retries) {
		try {
			const tokenAccount = await getOrCreateAssociatedTokenAccount(
				connection,
				payer,
				mint,
				owner,
				allowOwnerOffCurve
			);
			console.log(
				`Successfully created or retrieved token account: ${tokenAccount.address.toBase58()}`
			);
			return tokenAccount.address;
		} catch (error: any) {
			attempts++;
			console.error(
				`Failed attempt ${attempts} to create/retrieve token account: ${error.message}`
			);
			if (attempts < retries) {
				console.log(`Retrying in ${delay / 1000} seconds...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				throw error;
			}
		}
	}
	throw new Error(
		`Failed to create/retrieve token account after ${retries} attempts`
	);
}

export async function compressAccounts(connection: Connection, payer: Keypair) {
	console.log("Creating compress instruction...");
	const compressInstruction = await LightSystemProgram.compress({
		payer: payer.publicKey,
		toAddress: payer.publicKey,
		lamports: 1e8, // 0.1 SOL
		outputStateTree: defaultTestStateTreeAccounts().merkleTree,
	});
	console.log("Compress instruction created:", compressInstruction);

	console.log(
		"Compress Instruction Program ID:",
		compressInstruction.programId.toBase58()
	);

	console.log("Building compress transaction...");
	const transaction = new Transaction().add(compressInstruction);
	console.log("Compress transaction built.");

	console.log("Sending compress transaction...");
	const signature = await sendAndConfirmTransaction(connection, transaction, [
		payer,
	]);
	console.log(`Compressed lamports. Transaction ID: ${signature}`);
}
