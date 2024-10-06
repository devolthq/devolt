import * as anchor from "@coral-xyz/anchor";
import {
	Connection,
	Keypair,
	PublicKey,
	SendTransactionError,
	SystemProgram,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	getAssociatedTokenAddress,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PaymentEngine } from "../../../target/types/payment_engine";
import PaymentEngineIDL from "../../../target/idl/payment_engine.json";
import dotenv from "dotenv";
import {
	getOrCreateTokenAccount,
	getOrCreateTokenAccountPDA,
	initializeAccounts,
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
	"http://localhost:8899"
);
const wallet = new anchor.Wallet(devoltKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {});

console.log("Wallet public key:", wallet.publicKey.toBase58());
console.log("usdcMint:", usdcMint.toBase58());
console.log("voltMint:", voltMint.toBase58());

anchor.setProvider(provider);

const programId = new PublicKey(DEVOLT_PAYMENT_ENGINE_ID);
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

export async function sellEnergy(params: {
	producerKeypairBytes: number[];
	seed: number;
	usdcAmount: number;
}): Promise<
	| { transactionId: string; escrowPublicKey: string }
	| { error: { code: number; message: string } }
> {
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
		const [devoltEscrowPDA, _] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("devolt"),
				producerPubKey.toBuffer(),
				seedBN.toArrayLike(Buffer, "le", 8),
			],
			program.programId
		);
		console.log("Devolt Escrow PDA:", devoltEscrowPDA.toBase58());
		await ensureSolBalance(producerKeypair, connection, 1);
		await ensureSolBalance(devoltKeypair, connection, 1);
		const { keypairUsdcAccount, devoltUsdcAccount, devoltVoltAccount } =
			await initializeAccounts(
				connection,
				producerKeypair,
				devoltKeypair,
				usdcMint,
				voltMint
			);
		const producerUsdcAccount = keypairUsdcAccount;
		const accounts = {
			devolt: devoltKeypair.publicKey,
			producer: producerPubKey,
			usdcMint,
			voltMint,
			producerUsdcAccount,
			devoltUsdcAccount,
			devoltVoltAccount,
			devoltEscrow: devoltEscrowPDA,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
		};
		console.log("Accounts:", accounts);
		const producerBalanceUSDC = await connection.getTokenAccountBalance(
			producerUsdcAccount
		);
		console.log(
			"Producer USDC Balance:",
			producerBalanceUSDC.value.uiAmount
		);
		const requiredUsdcAmount = usdcAmountBN.toNumber();

		if (
			producerBalanceUSDC.value.uiAmount !== null &&
			producerBalanceUSDC.value.uiAmount < requiredUsdcAmount
		) {
			const mintAmount =
				requiredUsdcAmount - producerBalanceUSDC.value.uiAmount;
			console.log(
				`Minting ${mintAmount} USDC to Consumer's USDC Account ${producerUsdcAccount.toBase58()}`
			);
			try {
				await mintTo(
					connection,
					devoltKeypair,
					usdcMint,
					producerUsdcAccount,
					devoltKeypair.publicKey,
					mintAmount * 1_000_000
				);
				console.log(`Minting successful`);
			} catch (error: any) {
				console.error(`Minting failed: ${error.message}`);
				throw error;
			}
		}

		const tx = await program.methods
			.sellEnergy(seedBN, usdcAmountBN)
			.accounts(accounts)
			.signers([producerKeypair, devoltKeypair])
			.rpc();
		console.log("Transaction ID:", tx);

		// Log balances after successful transaction
		await logBalances(connection, producerPubKey, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return {
			transactionId: tx,
			escrowPublicKey: devoltEscrowPDA.toBase58(),
		};
	} catch (error: any) {
		if (error.logs) {
			const specificLog = error.logs.find((log: string) =>
				log.includes("Allocate: account Address")
			);
			if (specificLog) {
				const address = specificLog.split(" ")[2];
				console.log({
					error: {
						code: -32603,
						message: `Account ${address} already exists`,
					},
				});
				return {
					error: {
						code: -32603,
						message: `Account ${address} already exists`,
					},
				};
			}
		}

		console.error({
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		});
		return {
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		};
	}
}

export async function buyEnergy(params: {
	consumerKeypairBytes: number[];
	seed: number;
	energyAmount: number;
}): Promise<
	| { transactionId: string; escrowPublicKey: string }
	| { error: { code: number; message: string } }
> {
	const { consumerKeypairBytes, seed, energyAmount } = params;
	console.log("Received params:", params);
	try {
		if (consumerKeypairBytes.length !== 64) {
			throw new Error("Invalid secret key size. Expected 64 bytes.");
		}
		const consumerKeypair = Keypair.fromSecretKey(
			Uint8Array.from(consumerKeypairBytes)
		);
		console.log(
			"Consumer Keypair Public Key:",
			consumerKeypair.publicKey.toBase58()
		);
		const consumerPubKey = consumerKeypair.publicKey;
		const seedBN = new anchor.BN(seed);
		const energyAmountBN = new anchor.BN(energyAmount);
		const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("devolt"),
				consumerPubKey.toBuffer(),
				seedBN.toArrayLike(Buffer, "le", 8),
			],
			program.programId
		);
		console.log(
			"Devolt Escrow PDA for buyEnergy:",
			devoltEscrowPDA.toBase58()
		);
		// Garantir que o consumerKeypair e devoltKeypair possuem SOL suficiente
		await ensureSolBalance(consumerKeypair, connection, 1);
		await ensureSolBalance(devoltKeypair, connection, 1);
		const { keypairUsdcAccount, devoltUsdcAccount, devoltVoltAccount } =
			await initializeAccounts(
				connection,
				consumerKeypair,
				devoltKeypair,
				usdcMint,
				voltMint
			);
		const consumerUsdcAccount = keypairUsdcAccount;
		// Permitir Owner Off-Curve para a conta de escrow
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
		const consumerBalanceUSDC = await connection.getTokenAccountBalance(
			consumerUsdcAccount
		);
		console.log(
			"Consumer USDC Balance:",
			consumerBalanceUSDC.value.uiAmount
		);
		const requiredUsdcAmount = energyAmountBN.toNumber();

		if (
			consumerBalanceUSDC.value.uiAmount !== null &&
			consumerBalanceUSDC.value.uiAmount < requiredUsdcAmount
		) {
			const mintAmount =
				requiredUsdcAmount - consumerBalanceUSDC.value.uiAmount;
			console.log(
				`Minting ${mintAmount} USDC to Consumer's USDC Account ${consumerUsdcAccount.toBase58()}`
			);
			try {
				await mintTo(
					connection,
					devoltKeypair,
					usdcMint,
					consumerUsdcAccount,
					devoltKeypair.publicKey,
					mintAmount * 1_000_000
				);
				console.log(`Minting successful`);
			} catch (error: any) {
				console.error(`Minting failed: ${error.message}`);
				throw error;
			}
		}

		const tx = await program.methods
			.buyEnergy(seedBN, energyAmountBN)
			.accounts(accounts)
			.signers([consumerKeypair, devoltKeypair])
			.rpc();
		console.log("Transaction ID for buyEnergy:", tx);

		// Log balances after successful transaction
		await logBalances(connection, consumerPubKey, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return {
			transactionId: tx,
			escrowPublicKey: devoltEscrowPDA.toBase58(),
		};
	} catch (error: any) {
		console.error("Error in buyEnergy:", error);
		return {
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		};
	}
}

export async function confirmSelling(params: { escrowPublicKey: string }) {
	const { escrowPublicKey } = params;

	try {
		const escrowPubKey = new PublicKey(escrowPublicKey);

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

		const tx = await program.methods
			.confirmSelling()
			.accounts(accounts)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmSelling:", tx);

		// Log balances after successful transaction
		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return { transactionId: tx };
	} catch (error: any) {
		console.error("Error in confirmSelling:", error);
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

	try {
		const escrowPubKey = new PublicKey(escrowPublicKey);

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

		const devoltEscrowUsdcAccount = await getOrCreateTokenAccount(
			connection,
			devoltKeypair,
			usdcMint,
			escrowPubKey,
			true
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

		const tx = await program.methods
			.confirmBuying()
			.accounts(accounts)
			.signers([devoltKeypair])
			.rpc();
		console.log("Transaction ID for confirmBuying:", tx);

		// Log balances after successful transaction
		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [
			usdcMint,
			voltMint,
		]);

		return { transactionId: tx };
	} catch (error: any) {
		console.error("Error in confirmBuying:", error);
		return {
			error: {
				code: -32603,
				message: error.message || "Internal error",
			},
		};
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
