import {
	Connection,
	Keypair,
	sendAndConfirmTransaction,
	Transaction,
} from "@solana/web3.js";
import {
	LightSystemProgram,
	defaultTestStateTreeAccounts,
} from "@lightprotocol/stateless.js";

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
