import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { PaymentEngine } from "../../../../target/types/payment_engine";
import PaymentEngineIDL from "../../../../target/idl/payment_engine.json";

dotenv.config();

const DEVOLT_PRIVATE_KEY = process.env.DEVOLT_PRIVATE_KEY!;
const USDC_MINT = process.env.USDC_MINT!;
const VOLT_MINT = process.env.VOLT_MINT!;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";

let devoltKeypair: Keypair;
try {
	const keypairBytes = Uint8Array.from(JSON.parse(DEVOLT_PRIVATE_KEY));
	devoltKeypair = Keypair.fromSecretKey(keypairBytes);
} catch (error) {
	throw new Error(
		"DEVOLT_PRIVATE_KEY must be a valid JSON array of 32 bytes"
	);
}

const usdcMint = new PublicKey(USDC_MINT);
const voltMint = new PublicKey(VOLT_MINT);

const connection = new anchor.web3.Connection(RPC_URL);

const wallet = new anchor.Wallet(devoltKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {});

anchor.setProvider(provider);

const program = new anchor.Program<PaymentEngine>(
	PaymentEngineIDL as any,
	provider
);

export { connection, devoltKeypair, usdcMint, voltMint, program };
