import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SignatureStatus,
  SystemProgram,
  TransactionConfirmationStatus,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { KEYPAIR_SECRET, TARGETED_OWNER_PUBKEY, QUICKNODE_RPC } from "./vars";

const SIGNER_WALLET = Keypair.fromSecretKey(new Uint8Array(KEYPAIR_SECRET));
const DESTINATION_WALLET = TARGETED_OWNER_PUBKEY;

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC!);

const instructions: TransactionInstruction[] = [
  SystemProgram.transfer({
    fromPubkey: SIGNER_WALLET.publicKey,
    toPubkey: new PublicKey(DESTINATION_WALLET!),
    lamports: 0.01 * LAMPORTS_PER_SOL,
  }),
];

// console.log({
//   instructions,
//   SOLANA_CONNECTION,
//   SIGNER_WALLET,
//   DESTINATION_WALLET,
// });

async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = "confirmed",
  timeout: number = 30000,
  pollInterval: number = 1000,
  searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses(
      [signature],
      { searchTransactionHistory }
    );

    if (!statuses || statuses.length === 0) {
      throw new Error("Failed to get signature status");
    }

    const status: SignatureStatus | null = statuses[0]!;

    if (status === null) {
      // If status is null, the transaction is not yet known
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      continue;
    }

    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (
      status.confirmationStatus &&
      status.confirmationStatus === desiredConfirmationStatus
    ) {
      return status;
    }

    if (status.confirmationStatus === "finalized") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}
async function createAndSendV0Tx(txInstructions: TransactionInstruction[]) {
  // Step 1 - Fetch Latest Blockhash
  let latestBlockhash = await SOLANA_CONNECTION.getLatestBlockhash("finalized");
  console.log(
    "   ✅ - Fetched latest blockhash. Last Valid Height:",
    latestBlockhash.lastValidBlockHeight
  );

  // Step 2 - Generate Transaction Message
  const messageV0 = new TransactionMessage({
    payerKey: SIGNER_WALLET.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message();
  console.log("   ✅ - Compiled Transaction Message");

  const transaction = new VersionedTransaction(messageV0);

  // Step 3 - Sign your transaction with the required `Signers`
  transaction.sign([SIGNER_WALLET]);
  console.log("   ✅ - Transaction Signed");

  // Step 4 - Send our v0 transaction to the cluster
  const txid = await SOLANA_CONNECTION.sendTransaction(transaction, {
    maxRetries: 5,
  });
  console.log("   ✅ - Transaction sent to network");
  console.log({ txid });

  // Step 5 - Confirm Transaction
  const confirmation = await confirmTransaction(SOLANA_CONNECTION, txid);
  if (confirmation.err) {
    throw new Error("   ❌ - Transaction not confirmed.");
  }
  console.log(
    "🎉 Transaction Successfully Confirmed!",
    "\n",
    `https://explorer.solana.com/tx/${txid}?cluster=devnet`
  );
}

createAndSendV0Tx(instructions);
