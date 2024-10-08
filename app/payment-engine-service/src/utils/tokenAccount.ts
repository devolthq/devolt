import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

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
