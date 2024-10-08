import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PaymentEngine } from "../../../target/types/payment_engine";
import PaymentEngineIDL from "../../../target/idl/payment_engine.json";
import dotenv from "dotenv";
import {
	ensureDevoltUsdcBalance,
	getOrCreateTokenAccount,
	initializeAccounts,
	retryGetOrCreateTokenAccount,
	compressAccounts,
	getOrCreateTokenAccountPDA,
} from "./utils/accounts";

dotenv.config();

const DEVOLT_PRIVATE_KEY = process.env.DEVOLT_PRIVATE_KEY!;
const USDC_MINT = process.env.USDC_MINT!;
const VOLT_MINT = process.env.VOLT_MINT!;
const DEVOLT_PAYMENT_ENGINE_ID = process.env.DEVOLT_PAYMENT_ENGINE_ID!;

let devoltKeypair: Keypair;
try {
	const keypairBytes = Uint8Array.from(JSON.parse(DEVOLT_PRIVATE_KEY));
	devoltKeypair = Keypair.fromSecretKey(keypairBytes);
} catch (error) {
	throw new Error(
		"DEVOLT_PRIVATE_KEY deve ser um array JSON válido de números."
	);
}

const usdcMint = new PublicKey(USDC_MINT);
const voltMint = new PublicKey(VOLT_MINT);

const connection = new anchor.web3.Connection(
	// anchor.web3.clusterApiUrl("devnet")
	"http://127.0.0.1:8899"
);
const wallet = new anchor.Wallet(devoltKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {});

console.log("Wallet public key:", wallet.publicKey.toBase58());
console.log("usdcMint:", usdcMint.toBase58());
console.log("voltMint:", voltMint.toBase58());

anchor.setProvider(provider);

const program = new anchor.Program<PaymentEngine>(
	PaymentEngineIDL as any,
	provider
);

async function logBalances(
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

async function ensureSolBalance(
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

async function ensureBalance(
	type: "SOL" | "USDC",
	keypair: Keypair,
	account: PublicKey,
	requiredAmount: number
) {
	if (type === "SOL") {
		await ensureSolBalance(keypair, connection, requiredAmount);
	} else if (type === "USDC") {
		await ensureDevoltUsdcBalance(
			connection,
			devoltKeypair,
			account,
			usdcMint,
			requiredAmount
		);
	}
}

function createBuyAccountsSetup(
	consumerPubKey: PublicKey,
	devoltEscrowPDA: PublicKey
) {
	return {
		devolt: devoltKeypair.publicKey,
		consumer: consumerPubKey,
		usdcMint,
		voltMint,
		associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	};
}

function createSellAccountsSetup(
	producerPubKey: PublicKey,
	devoltEscrowPDA: PublicKey
) {
	return {
		devolt: devoltKeypair.publicKey,
		producer: producerPubKey,
		usdcMint,
		voltMint,
		associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	};
}

function handleError(error: any) {
	console.error("Error:", error.message || "Internal error");
	if (error.logs) {
		const specificLog = error.logs.find((log: string) =>
			log.includes("Allocate: account Address")
		);
		if (specificLog) {
			const address = specificLog.split(" ")[2];
			console.error(`Account ${address} already exists`);
			return {
				error: {
					code: -32603,
					message: `Account ${address} already exists`,
				},
			};
		}
	}
	return {
		error: { code: -32603, message: error.message || "Internal error" },
	};
}

export async function sellEnergy(params: {
	producerKeypairBytes: number[];
	seed: number;
	usdcAmount: number;
}) {
	const { producerKeypairBytes, seed, usdcAmount } = params;
	console.log("Received params:", params);
	try {
		console.log(
			"producerKeypairBytes.length:",
			producerKeypairBytes.length
		);
		if (producerKeypairBytes.length !== 64) {
			throw new Error("Invalid secret key size. Expected 64 bytes.");
		}
		const producerKeypair = Keypair.fromSecretKey(
			Uint8Array.from(producerKeypairBytes)
		);
		console.log(
			"Producer Keypair Public Key:",
			producerKeypair.publicKey.toBase58()
		);
		const producerPubKey = producerKeypair.publicKey;
		console.log("Producer Public Key:", producerPubKey.toBase58());
		const seedBN = new anchor.BN(seed);
		console.log("Seed BN:", seedBN.toString());
		const usdcAmountBN = new anchor.BN(usdcAmount);
		console.log("USDC Amount BN:", usdcAmountBN.toString());

		// Chamada para compressAccounts antes de qualquer operação
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

		await ensureBalance("SOL", devoltKeypair, devoltKeypair.publicKey, 1);
		await ensureBalance("SOL", producerKeypair, producerPubKey, 1);

		console.log("Initializing accounts...");
		const { devoltUsdcAccount, devoltVoltAccount } =
			await initializeAccounts(
				connection,
				producerKeypair,
				devoltKeypair,
				usdcMint,
				voltMint
			);
		const accounts = {
			...createSellAccountsSetup(producerPubKey, devoltEscrowPDA),
			devoltUsdcAccount,
			devoltVoltAccount,
			devoltEscrow: devoltEscrowPDA,
		};
		console.log("Accounts:", accounts);

		await ensureBalance(
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

export async function buyEnergy(params: {
	consumerKeypairBytes: number[];
	seed: number;
	energyAmount: number;
}): Promise<
	| { transaction_id: string; escrow_public_key: string }
	| { error: { code: number; message: string } }
> {
	const { consumerKeypairBytes, seed, energyAmount } = params;
	console.log("Received params:", params);
	try {
		const consumerKeypair = Keypair.fromSecretKey(
			Uint8Array.from(consumerKeypairBytes)
		);
		const consumerPubKey = consumerKeypair.publicKey;
		console.log("Consumer Keypair Public Key:", consumerPubKey.toBase58());

		const seedBN = new anchor.BN(seed);
		const energyAmountBN = new anchor.BN(energyAmount);
		const [devoltEscrowPDA] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("devolt"),
				consumerPubKey.toBuffer(),
				seedBN.toArrayLike(Buffer, "le", 8),
			],
			program.programId
		);
		console.log("Devolt Escrow PDA:", devoltEscrowPDA.toBase58());

		// Chamada para compressAccounts antes de qualquer operação
		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		await ensureBalance("SOL", devoltKeypair, devoltKeypair.publicKey, 1);

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
			consumerKeypair.publicKey,
			false
		);
		console.log("Consumer USDC Account:", consumerUsdcAccount.toBase58());

		const devoltEscrowUsdcAccount = await getOrCreateTokenAccountPDA(
			connection,
			devoltKeypair,
			usdcMint,
			devoltEscrowPDA,
			true
		);
		console.log(
			"Devolt Escrow USDC Account:",
			devoltEscrowUsdcAccount.toBase58()
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

		// Garantir que a conta de USDC do consumidor tenha saldo suficiente
		await ensureBalance(
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

export async function confirmSelling(params: { escrowPublicKey: string }) {
	const { escrowPublicKey } = params;
	console.log("confirmSelling called with params:", params);

	try {
		const escrowPubKey = new PublicKey(escrowPublicKey);
		console.log("Escrow Public Key:", escrowPubKey.toBase58());

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		const account = await program.account.deVoltEscrow.fetch(escrowPubKey);
		console.log("Fetched escrow account for confirmSelling:", account);

		console.log("Creating or retrieving Devolt USDC Account...");
		const devoltUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			devoltKeypair.publicKey
		);
		console.log("Devolt USDC Account:", devoltUsdcAccount.toBase58());

		console.log("Creating or retrieving Devolt VOLT Account...");
		const devoltVoltAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			voltMint,
			devoltKeypair.publicKey
		);
		console.log("Devolt VOLT Account:", devoltVoltAccount.toBase58());

		console.log("Creating or retrieving Producer USDC Account...");
		const producerUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			account.maker
		);
		console.log("Producer USDC Account:", producerUsdcAccount.toBase58());

		// Verificação de saldo e minting se necessário
		await ensureBalance(
			"USDC",
			devoltKeypair,
			devoltUsdcAccount,
			account.usdc.toNumber()
		);

		const accounts = {
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
		console.log("Accounts for confirmSelling:", accounts);

		console.log("Preparing transaction to confirm selling...");
		const tx = await program.methods
			.confirmSelling()
			.accounts(accounts)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmSelling:", tx);

		// Log dos saldos após a transação
		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return { transaction_id: tx };
	} catch (error: any) {
		console.error("Error in confirmSelling:", error);

		if (error.logs) {
			console.log("Error logs:", error.logs.join("\n"));
		}

		if (error.transactionSignature) {
			try {
				const txDetails = await connection.getTransaction(
					error.transactionSignature,
					{ commitment: "confirmed" }
				);
				console.log("Transaction details:", txDetails);
			} catch (txError) {
				console.error("Error fetching transaction details:", txError);
			}
		}

		return {
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		};
	}
}

export async function confirmBuying(params: { escrowPublicKey: string }) {
	const { escrowPublicKey } = params;
	console.log("confirmBuying called with params:", params);

	try {
		const escrowPubKey = new PublicKey(escrowPublicKey);
		console.log("Escrow Public Key:", escrowPubKey.toBase58());

		console.log("Compressing accounts...");
		await compressAccounts(connection, devoltKeypair);
		console.log("Compression complete.");

		const account = await program.account.deVoltEscrow.fetch(escrowPubKey);
		console.log("Fetched escrow account for confirmBuying:", account);

		console.log("Creating or retrieving Devolt USDC Account...");
		const devoltUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			devoltKeypair.publicKey
		);
		console.log("Devolt USDC Account:", devoltUsdcAccount.toBase58());

		console.log("Creating or retrieving Devolt VOLT Account...");
		const devoltVoltAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			voltMint,
			devoltKeypair.publicKey
		);
		console.log("Devolt VOLT Account:", devoltVoltAccount.toBase58());

		console.log("Creating or retrieving Consumer USDC Account...");
		const consumerUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			account.maker
		);
		console.log("Consumer USDC Account:", consumerUsdcAccount.toBase58());

		console.log("Creating or retrieving Devolt Escrow USDC Account...");
		const devoltEscrowUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			escrowPubKey,
			true
		);
		console.log(
			"Devolt Escrow USDC Account:",
			devoltEscrowUsdcAccount.toBase58()
		);

		// Verificação de saldo e minting se necessário
		await ensureBalance(
			"USDC",
			devoltKeypair,
			devoltUsdcAccount,
			account.usdc.toNumber()
		);

		const accounts = {
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
		console.log("Accounts for confirmBuying:", accounts);

		console.log("Preparing transaction to confirm buying...");
		const tx = await program.methods
			.confirmBuying()
			.accounts(accounts)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmBuying:", tx);

		// Log dos saldos após a transação
		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return { transaction_id: tx };
	} catch (error: any) {
		console.error("Error in confirmBuying:", error);

		if (error.logs) {
			console.log("Error logs:", error.logs.join("\n"));
		}

		if (error.transactionSignature) {
			try {
				const txDetails = await connection.getTransaction(
					error.transactionSignature,
					{ commitment: "confirmed" }
				);
				console.log("Transaction details:", txDetails);
			} catch (txError) {
				console.error("Error fetching transaction details:", txError);
			}
		}

		return {
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		};
	}
}
