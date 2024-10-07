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

// new PublicKey(DEVOLT_PAYMENT_ENGINE_ID),
const program = new anchor.Program<PaymentEngine>(
	PaymentEngineIDL as any,
	provider
);

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

// Função auxiliar para configurar as contas
function createBuyAccountsSetup(consumerPubKey: PublicKey, devoltEscrowPDA: PublicKey) {
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

function createSellAccountsSetup(producerPubKey: PublicKey, devoltEscrowPDA: PublicKey) {
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

// Função para registrar o saldo das contas
async function logBalances(connection: anchor.web3.Connection, pubkey: PublicKey, mints: PublicKey[]) {
	for (const mint of mints) {
		const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, devoltKeypair, mint, pubkey);
		const balance = await connection.getTokenAccountBalance(tokenAccount.address);
		console.log(`${pubkey.toBase58()} Balance for ${mint.toBase58()}:`, balance.value.uiAmount);
	}
}

// Função genérica para garantir que o saldo está acima do mínimo necessário (SOL ou USDC)
async function ensureBalance(type: 'SOL' | 'USDC', keypair: Keypair, account: PublicKey, requiredAmount: number) {
	if (type === 'SOL') {
		await ensureSolBalance(keypair, connection, requiredAmount);
	} else if (type === 'USDC') {
		await ensureDevoltUsdcBalance(connection, devoltKeypair, account, usdcMint, requiredAmount);
	}
}

// Função genérica para tratamento de erro
function handleError(error: any) {
	console.error("Error:", error.message || "Internal error");
	if (error.logs) {
		const specificLog = error.logs.find((log: string) => log.includes("Allocate: account Address"));
		if (specificLog) {
			const address = specificLog.split(" ")[2];
			console.error(`Account ${address} already exists`);
			return { error: { code: -32603, message: `Account ${address} already exists` } };
		}
	}
	return { error: { code: -32603, message: error.message || "Internal error" } };
}

// Função para manipular o processo de venda de energia
export async function sellEnergy(params: { producerKeypairBytes: number[]; seed: number; usdcAmount: number }) {
	const { producerKeypairBytes, seed, usdcAmount } = params;
	try {
		const producerKeypair = Keypair.fromSecretKey(Uint8Array.from(producerKeypairBytes));
		const producerPubKey = producerKeypair.publicKey;

		const seedBN = new anchor.BN(seed);
		const usdcAmountBN = new anchor.BN(usdcAmount);
		const [devoltEscrowPDA] = PublicKey.findProgramAddressSync(
			[Buffer.from("devolt"), producerPubKey.toBuffer(), seedBN.toArrayLike(Buffer, "le", 8)],
			program.programId
		);

		await ensureBalance('SOL', devoltKeypair, devoltKeypair.publicKey, 1);
		const { devoltUsdcAccount, devoltVoltAccount } = await initializeAccounts(connection, producerKeypair, devoltKeypair, usdcMint, voltMint);

		// const accounts = {
        //     devolt: devoltKeypair.publicKey,
        //     consumer: consumerPubKey,
        //     usdcMint,
        //     voltMint,
        //     consumerUsdcAccount: keypairUsdcAccount,
        //     devoltUsdcAccount,
        //     devoltVoltAccount,
        //     devoltEscrow: devoltEscrowPDA,
        //     devoltEscrowUsdcAccount: devoltEscrowUsdcAccount.address,  // Ensure the address is passed
        //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        //     tokenProgram: TOKEN_PROGRAM_ID,
        //     systemProgram: SystemProgram.programId,
        // };
		const accounts = {
			...createSellAccountsSetup(producerPubKey, devoltEscrowPDA),
			devoltUsdcAccount,
			devoltVoltAccount,
			devoltEscrow: devoltEscrowPDA,
		};

		await ensureBalance('USDC', devoltKeypair, devoltUsdcAccount, usdcAmount);
		const tx = await program.methods.sellEnergy(seedBN, usdcAmountBN).accountsPartial(accounts).signers([producerKeypair, devoltKeypair]).rpc();

		await logBalances(connection, producerPubKey, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [usdcMint, voltMint]);

		return { transactionId: tx, escrowPublicKey: devoltEscrowPDA.toBase58() };
	} catch (error: any) {
		return handleError(error);
	}
}

export async function buyEnergy(params: { consumerKeypairBytes: number[]; seed: number; energyAmount: number }) {
    const { consumerKeypairBytes, seed, energyAmount } = params;
    try {
        const consumerKeypair = Keypair.fromSecretKey(Uint8Array.from(consumerKeypairBytes));
        const consumerPubKey = consumerKeypair.publicKey;

        const seedBN = new anchor.BN(seed);
        const energyAmountBN = new anchor.BN(energyAmount);
        const [devoltEscrowPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("devolt"), consumerPubKey.toBuffer(), seedBN.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        // Garante que o saldo de SOL é suficiente
        await ensureBalance('SOL', devoltKeypair, devoltKeypair.publicKey, 1);

        // Inicializa as contas associadas
        const { keypairUsdcAccount, devoltUsdcAccount, devoltVoltAccount } = await initializeAccounts(
            connection,
            consumerKeypair,
            devoltKeypair,
            usdcMint,
            voltMint
        );

        // Cria ou recupera a conta de USDC associada ao PDA de escrow
        const devoltEscrowUsdcAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            devoltKeypair,
            usdcMint,
            devoltEscrowPDA,
            true  // Allow off-curve for PDAs
        );

        const accounts = {
            devolt: devoltKeypair.publicKey,
            consumer: consumerPubKey,
            usdcMint,
            voltMint,
            consumerUsdcAccount: keypairUsdcAccount,
            devoltUsdcAccount,
            devoltVoltAccount,
            devoltEscrow: devoltEscrowPDA,
            devoltEscrowUsdcAccount: devoltEscrowUsdcAccount.address,  // Ensure the address is passed
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        };

        console.log("Accounts setup for buyEnergy:", accounts);

        // Garante que o saldo de USDC do consumidor é suficiente
        // await ensureBalance('USDC', devoltKeypair, keypairUsdcAccount, energyAmount);

        // Envia a transação para comprar energia
        const tx = await program.methods.buyEnergy(seedBN, energyAmountBN).accounts(accounts).signers([consumerKeypair, devoltKeypair]).rpc();
        console.log("Transaction ID for buyEnergy:", tx);

        // Log das contas após a transação
        await logBalances(connection, consumerPubKey, [usdcMint]);
        await logBalances(connection, devoltKeypair.publicKey, [usdcMint, voltMint]);

        return { transactionId: tx, escrowPublicKey: devoltEscrowPDA.toBase58() };
    } catch (error: any) {
        return handleError(error);
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

		// Verificar e garantir que a DeVolt tenha saldo suficiente de USDC
		const devoltUsdcBalance = await connection.getTokenAccountBalance(devoltUsdcAccount);
		const requiredUsdcAmount = account.usdc.toNumber();

		if (devoltUsdcBalance.value.uiAmount !== null && devoltUsdcBalance.value.uiAmount < requiredUsdcAmount) {
			const mintAmount = requiredUsdcAmount - devoltUsdcBalance.value.uiAmount;
			if (typeof(mintAmount) == "number") {
				console.log(`Minting ${mintAmount} USDC to DeVolt's USDC Account...`);
				await mintTo(
					connection,
					devoltKeypair,
					usdcMint,
					devoltUsdcAccount,
					devoltKeypair.publicKey,
					mintAmount // * 1_000_000 // Convertendo para a menor unidade
				);
				console.log("Minted additional USDC.");
			}
		}

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
		await logBalances(connection, devoltKeypair.publicKey, [usdcMint, voltMint]);

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

		// Verificar e garantir que a DeVolt tenha saldo suficiente de USDC
		const devoltUsdcBalance = await connection.getTokenAccountBalance(devoltUsdcAccount);
		const requiredUsdcAmount = account.usdc.toNumber();

		if (devoltUsdcBalance.value.uiAmount !== null && devoltUsdcBalance.value.uiAmount < requiredUsdcAmount) {
			const mintAmount = requiredUsdcAmount - devoltUsdcBalance.value.uiAmount;
			if (typeof(mintAmount)=="number") {
				console.log(`Minting ${mintAmount} USDC to DeVolt's USDC Account...`);
			await mintTo(
				connection,
				devoltKeypair,
				usdcMint,
				devoltUsdcAccount,
				devoltKeypair.publicKey,
				mintAmount // * 1_000_000 // Convertendo para a menor unidade
			);
			console.log("Minted additional USDC.");
			}	
		}

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

		// Log balances após a transação
		await logBalances(connection, account.maker, [usdcMint]);
		await logBalances(connection, devoltKeypair.publicKey, [usdcMint, voltMint]);

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
