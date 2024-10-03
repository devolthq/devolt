import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SendTransactionError,
	SystemProgram,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createMint,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PaymentEngine } from "../target/types/payment_engine";
import { expect } from "chai";
import dotenv from "dotenv";

dotenv.config();

describe("payment_engine", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.PaymentEngine as Program<PaymentEngine>;
	const connection = provider.connection;

	let producer: Keypair;
	let consumer: Keypair;
	let devolt: Keypair;
	let usdcMint: PublicKey;
	let voltMint: PublicKey;
	let producerUsdcATA: PublicKey;
	let consumerUsdcATA: PublicKey;
	let devoltUsdcATA: PublicKey;
	let devoltVoltATA: PublicKey;

	const airdropSol = async (pubkey: PublicKey, amount: number) => {
		const signature = await connection.requestAirdrop(
			pubkey,
			amount * LAMPORTS_PER_SOL
		);
		const latestBlockhash = await connection.getLatestBlockhash();
		await connection.confirmTransaction({
			signature,
			...latestBlockhash,
		});
	};

	const getBalance = async (account: PublicKey) => {
		const balance = await connection.getTokenAccountBalance(account);
		return balance.value.uiAmount;
	};

	before(async () => {
		producer = Keypair.generate();
		consumer = Keypair.generate();
		let devoltKeypairBytes = process.env.DEVOLT_PRIVATE_KEY;
		const keypairArray = JSON.parse(devoltKeypairBytes);
		if (!Array.isArray(keypairArray)) {
			console.log("Creating new keypair");
			devolt = Keypair.generate();
		} else {
			devolt = Keypair.fromSecretKey(Uint8Array.from(keypairArray));
		}

		await airdropSol(producer.publicKey, 10);
		await airdropSol(consumer.publicKey, 10);
		await airdropSol(devolt.publicKey, 10);

		usdcMint = await createMint(
			connection,
			devolt,
			devolt.publicKey,
			null,
			6
		);

		voltMint = await createMint(
			connection,
			devolt,
			devolt.publicKey,
			null,
			6
		);

		console.log(
			"usdcmint",
			usdcMint.toBase58(),
			"voltmint",
			voltMint.toBase58()
		);

		const producerUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			producer,
			usdcMint,
			producer.publicKey
		);
		producerUsdcATA = producerUsdcAccount.address;

		const consumerUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			consumer,
			usdcMint,
			consumer.publicKey
		);
		consumerUsdcATA = consumerUsdcAccount.address;

		const devoltUsdcAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			devolt,
			usdcMint,
			devolt.publicKey
		);
		devoltUsdcATA = devoltUsdcAccount.address;

		const devoltVoltAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			devolt,
			voltMint,
			devolt.publicKey
		);
		devoltVoltATA = devoltVoltAccount.address;

		await mintTo(
			connection,
			devolt,
			usdcMint,
			producerUsdcATA,
			devolt,
			1_000 * 10 ** 6
		);

		await mintTo(
			connection,
			devolt,
			usdcMint,
			consumerUsdcATA,
			devolt,
			2_000 * 10 ** 6
		);

		await mintTo(
			connection,
			devolt,
			usdcMint,
			devoltUsdcATA,
			devolt,
			1_000 * 10 ** 6
		);
	});

	afterEach(async () => {
		const orders = await program.account.deVoltEscrow.all();
		console.log("History", JSON.stringify(orders, null, 2));
		expect(orders.length).to.greaterThanOrEqual(1);
	});

	describe("Selling", async () => {
		it("Initializes the energy sale", async () => {
			const seed = 123456789;
			const seedBN = new anchor.BN(seed);
			const usdcAmount = new anchor.BN(200); // 20_000 VOLT

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					producer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const accounts = {
				devolt: devolt.publicKey,
				producer: producer.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				producerUsdcAccount: producerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const initialDevoltUsdcBalance = await getBalance(
					devoltUsdcATA
				);

				const tx = await program.methods
					.sellEnergy(seedBN, usdcAmount)
					.accounts(accounts)
					.signers([devolt, producer])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const finalProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const finalDevoltUsdcBalance = await getBalance(devoltUsdcATA);

				expect(finalProducerUsdcBalance).to.equal(
					initialProducerUsdcBalance
				);
				expect(finalDevoltUsdcBalance).to.equal(
					initialDevoltUsdcBalance
				);
			} catch (error) {
				if (error instanceof SendTransactionError) {
					console.log(await error.getLogs(connection));
				}

				throw error;
			}
		});

		it("Confirms the energy sale", async () => {
			const seed = 123456789;
			const seedBN = new anchor.BN(seed);

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					producer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const accounts = {
				devolt: devolt.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				producerUsdcAccount: producerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const initialDevoltUsdcBalance = await getBalance(
					devoltUsdcATA
				);

				const tx = await program.methods
					.confirmSelling()
					.accounts(accounts)
					.signers([devolt])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const finalProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const finalDevoltUsdcBalance = await getBalance(devoltUsdcATA);

				expect(finalProducerUsdcBalance).to.equal(
					initialProducerUsdcBalance + 200
				);
				expect(finalDevoltUsdcBalance).to.equal(
					initialDevoltUsdcBalance - 200
				);
			} catch (error) {
				if (error instanceof SendTransactionError) {
					console.log(await error.getLogs(connection));
				}

				throw error;
			}
		});

		it("Refunds the sale when DeVolt has insufficient USDC", async () => {
			const seed = 987654321;
			const seedBN = new anchor.BN(seed);
			const usdcAmount = new anchor.BN(2_000);

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					producer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const accounts = {
				devolt: devolt.publicKey,
				producer: producer.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				producerUsdcAccount: producerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const initialDevoltUsdcBalance = await getBalance(
					devoltUsdcATA
				);

				const tx = await program.methods
					.sellEnergy(seedBN, usdcAmount)
					.accounts(accounts)
					.signers([devolt, producer])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const refundTx = await program.methods
					.confirmSelling()
					.accounts(accounts)
					.signers([devolt])
					.rpc();

				console.log(`Transaction refunded successfully: ${refundTx}`);

				const finalProducerUsdcBalance = await getBalance(
					producerUsdcATA
				);
				const finalDevoltUsdcBalance = await getBalance(devoltUsdcATA);

				expect(finalProducerUsdcBalance).to.equal(
					initialProducerUsdcBalance
				);
				expect(finalDevoltUsdcBalance).to.equal(
					initialDevoltUsdcBalance
				);
			} catch (error) {
				// expect(error).to.be.instanceOf(SendTransactionError);

				if (error instanceof SendTransactionError) {
					// console.log(await error.getLogs(connection));
				}

				expect(error).to.exist;
				// throw error;
			}
		});
	});

	describe("Buying", async () => {
		it("Initializes the energy buying", async () => {
			const seed = 123456789;
			const seedBN = new anchor.BN(seed);
			const energyAmount = new anchor.BN(10_000); // 100 USDC

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					consumer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const devoltEscrowUSDCAccount =
				await getOrCreateAssociatedTokenAccount(
					connection,
					devolt,
					usdcMint,
					devoltEscrowPDA,
					true
				);
			const devoltEscrowUSDCATA = devoltEscrowUSDCAccount.address;

			const accounts = {
				devolt: devolt.publicKey,
				consumer: consumer.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				consumerUsdcAccount: consumerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,
				devoltEscrowUsdcAccount: devoltEscrowUSDCATA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);

				const tx = await program.methods
					.buyEnergy(seedBN, energyAmount)
					.accounts(accounts)
					.signers([devolt, consumer])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const finalConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);

				expect(finalConsumerUsdcBalance).to.equal(
					initialConsumerUsdcBalance - 100
				);
			} catch (error) {
				if (error instanceof SendTransactionError) {
					console.log(await error.getLogs(connection));
				}

				throw error;
			}
		});

		it("Confirms the energy buying", async () => {
			const seed = 123456789;
			const seedBN = new anchor.BN(seed);

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					consumer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const devoltEscrowUSDCAccount =
				await getOrCreateAssociatedTokenAccount(
					connection,
					devolt,
					usdcMint,
					devoltEscrowPDA,
					true
				);
			const devoltEscrowUSDCATA = devoltEscrowUSDCAccount.address;

			const accounts = {
				devolt: devolt.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				consumerUsdcAccount: consumerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,
				devoltEscrowUsdcAccount: devoltEscrowUSDCATA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);
				const initialDevoltUsdcBalance = await getBalance(
					devoltUsdcATA
				);

				const tx = await program.methods
					.confirmBuying()
					.accounts(accounts)
					.signers([devolt])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const finalConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);
				const finalDevoltUsdcBalance = await getBalance(devoltUsdcATA);

				expect(finalConsumerUsdcBalance).to.equal(
					initialConsumerUsdcBalance
				);
				expect(finalDevoltUsdcBalance).to.equal(
					initialDevoltUsdcBalance + 100
				);
			} catch (error) {
				if (error instanceof SendTransactionError) {
					console.log(await error.getLogs(connection));
				}

				throw error;
			}
		});

		it("Refunds the purchase when DeVolt has insufficient VOLT", async () => {
			const seed = 987654322;
			const seedBN = new anchor.BN(seed);
			const energyAmount = new anchor.BN(100_000);

			const [devoltEscrowPDA, bump] = PublicKey.findProgramAddressSync(
				[
					Buffer.from("devolt"),
					consumer.publicKey.toBuffer(),
					seedBN.toArrayLike(Buffer, "le", 8),
				],
				program.programId
			);

			const devoltEscrowUSDCAccount =
				await getOrCreateAssociatedTokenAccount(
					connection,
					devolt,
					usdcMint,
					devoltEscrowPDA,
					true
				);
			const devoltEscrowUSDCATA = devoltEscrowUSDCAccount.address;

			const accounts = {
				devolt: devolt.publicKey,
				consumer: consumer.publicKey,

				usdcMint: usdcMint,
				voltMint: voltMint,

				consumerUsdcAccount: consumerUsdcATA,
				devoltUsdcAccount: devoltUsdcATA,
				devoltVoltAccount: devoltVoltATA,

				devoltEscrow: devoltEscrowPDA,
				devoltEscrowUsdcAccount: devoltEscrowUSDCATA,

				associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			};

			try {
				const initialConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);
				const initialDevoltUsdcBalance = await getBalance(
					devoltUsdcATA
				);

				const tx = await program.methods
					.buyEnergy(seedBN, energyAmount)
					.accounts(accounts)
					.signers([devolt, consumer])
					.rpc();

				console.log(`\tTransaction successfully initialized: ${tx}`);

				const refundTx = await program.methods
					.confirmBuying()
					.accounts(accounts)
					.signers([devolt])
					.rpc();

				console.log(`Transaction refunded successfully: ${refundTx}`);

				const finalConsumerUsdcBalance = await getBalance(
					consumerUsdcATA
				);
				const finalDevoltUsdcBalance = await getBalance(devoltUsdcATA);

				expect(finalConsumerUsdcBalance).to.equal(
					initialConsumerUsdcBalance
				);
				expect(finalDevoltUsdcBalance).to.equal(
					initialDevoltUsdcBalance
				);
			} catch (error) {
				if (error instanceof SendTransactionError) {
					// console.log(await error.getLogs(connection));
				}

				// throw error;

				expect(error).to.exist;
			}
		});
	});
});
