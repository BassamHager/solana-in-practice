import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  createKeyPairFromBytes,
  createSignerFromKeyPair,
} from "@solana/kit";
import {
  TOKEN_PROGRAM_ADDRESS,
  getTransferInstruction,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
} from "@solana-program/token";
import {
  KEYPAIR_SECRET,
  MINT_ADD_USDC_DUMMY,
  QUICKNODE_RPC,
  QUICKNODE_RPC_SUBSCRIPTIONS,
  TARGETED_OWNER_PUBKEY,
} from "./variables";

const rpc = createSolanaRpc(QUICKNODE_RPC);
const rpcSubscriptions = createSolanaRpcSubscriptions(
  QUICKNODE_RPC_SUBSCRIPTIONS
);
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

const DESTINATION_WALLET = address(TARGETED_OWNER_PUBKEY);
const MINT_ADDRESS = address(MINT_ADD_USDC_DUMMY);
const TRANSFER_AMOUNT = 1n;

async function getNumberDecimals(mintAddress) {
  // getAccountInfo defaults to binary, using `jsonParsed` lets us read parsed.info.decimals without manual byte offsets.
  const accountInfo = await rpc
    .getAccountInfo(mintAddress, { encoding: "jsonParsed" })
    .send();

  const data = accountInfo.value?.data;
  if (!data || !("parsed" in data) || !data.parsed?.info) {
    throw new Error("Failed to find mint account");
  }

  return (data.parsed.info as { decimals: number }).decimals;
}

// --- DEBUG helpers ---
async function printAccountInfo(label: string, acct: string) {
  try {
    const info = await rpc
      .getAccountInfo(address(acct), { encoding: "jsonParsed" })
      .send();
    if (!info.value) {
      console.log(`${label}: MISSING`, { info });
      return;
    }
    console.log(`${label}: exists — owner: ${info.value.owner}`);
    const data = info.value.data;
    if (data && typeof data !== "string") {
      if ("parsed" in data && data.parsed) {
        console.log(`${label} parsed:`, data.parsed.type, data.parsed.info);
      } else {
        console.log(
          `${label} data: binary length=${data /* .length */ ?? "?"}`
        );
      }
    } else {
      console.log(`${label} raw data present`);
    }
  } catch (err) {
    console.log(`${label}: error reading account`, err);
  }
}

async function getTokenAccountsByOwnerAndPrint(
  ownerAddr: string,
  mintAddr: string
) {
  try {
    const resp = await rpc
      .getTokenAccountsByOwner(address(ownerAddr), { mint: address(mintAddr) })
      .send();
    console.log(
      "getTokenAccountsByOwner resp:",
      JSON.stringify(resp.value, null, 2)
    );
  } catch (err) {
    console.log("getTokenAccountsByOwner error", err);
  }
}

async function sendTokens() {
  console.log(
    `Sending ${TRANSFER_AMOUNT} ${MINT_ADDRESS} to ${DESTINATION_WALLET}.`
  );

  //Step 1
  console.log(`1 - Creating keypair and funding with SOL`);
  const keyPair = await createKeyPairFromBytes(new Uint8Array(KEYPAIR_SECRET));
  const FROM_KEYPAIR = await createSignerFromKeyPair(keyPair);

  // Fund the keypair with SOL for transaction fees
  // (you can skip this step if you already have devnet SOL in your FROM_KEYPAIR)
  // await airdropFactory({ rpc, rpcSubscriptions })({
  //   recipientAddress: FROM_KEYPAIR.address,
  //   lamports: lamports(1_000_000_000n), // 1 SOL
  //   commitment: "confirmed",
  // });

  console.log(`    From wallet: ${FROM_KEYPAIR.address}`);

  //Step 2
  console.log(`2 - Deriving Associated Token Accounts`);

  const [sourceTokenAccount] = await findAssociatedTokenPda({
    owner: FROM_KEYPAIR.address,
    mint: MINT_ADDRESS,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const [destinationTokenAccount] = await findAssociatedTokenPda({
    owner: DESTINATION_WALLET,
    mint: MINT_ADDRESS,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  console.log(`    Source Token Account: ${sourceTokenAccount}`);
  console.log(`    Destination Token Account: ${destinationTokenAccount}`);

  //Step 3
  console.log(`3 - Checking Destination Token Account`);
  let needsDestinationAccount = false;
  try {
    console.log("***===========***");
    await rpc.getAccountInfo(destinationTokenAccount).send();
    console.log("***===========***");
  } catch (error) {
    needsDestinationAccount = true;
  }

  if (needsDestinationAccount) {
    console.log(`    Destination token account does not exist, will create it`);
  } else {
    console.log(`    Destination token account exists`);
  }

  //Step 4
  console.log(`4 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
  const numberDecimals = await getNumberDecimals(MINT_ADDRESS);
  console.log(`    Number of Decimals: ${numberDecimals}`);

  const transferAmountWithDecimals =
    TRANSFER_AMOUNT * BigInt(Math.pow(10, numberDecimals));

  //Step 5
  console.log(`5 - Creating and Sending Transaction`);

  // --- perform checks before building tx ---
  await printAccountInfo("Source ATA", sourceTokenAccount);
  await printAccountInfo("Destination ATA", destinationTokenAccount);
  await printAccountInfo("Mint account", MINT_ADDRESS);

  // list token accounts for FROM_KEYPAIR (to see where tokens actually live and balances)
  // await getTokenAccountsByOwnerAndPrint(FROM_KEYPAIR.address, MINT_ADDRESS);

  // --- Build create-ATA instructions for both source & destination (idempotent) ---
  const createSourceAtaIx = getCreateAssociatedTokenIdempotentInstruction({
    payer: FROM_KEYPAIR,
    ata: sourceTokenAccount,
    owner: FROM_KEYPAIR.address,
    mint: MINT_ADDRESS,
  });

  const createDestinationAtaIx = getCreateAssociatedTokenIdempotentInstruction({
    payer: FROM_KEYPAIR,
    ata: destinationTokenAccount,
    owner: DESTINATION_WALLET,
    mint: MINT_ADDRESS,
  });

  ///////

  let latestBlockhash, lastValidBlockHeight;
  try {
    const { value } = await rpc.getLatestBlockhash().send();
    latestBlockhash = value;
    lastValidBlockHeight = value.lastValidBlockHeight;
  } catch (error) {
    console.log("error in getLatestBlockhash", { error });
  }

  // Ensure latestBlockhash object is { blockhash, lastValidBlockHeight }
  if (
    !latestBlockhash ||
    !latestBlockhash.blockhash ||
    latestBlockhash.lastValidBlockHeight == null
  ) {
    throw new Error("Invalid latestBlockhash object");
  }

  // // Recompute transfer amount (already done earlier)
  console.log(
    "transferAmountWithDecimals:",
    transferAmountWithDecimals.toString()
  );

  // Build transaction message — create both ATAs then transfer
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(FROM_KEYPAIR, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        tx
      ),
    (tx) => appendTransactionMessageInstruction(createSourceAtaIx, tx),
    (tx) => appendTransactionMessageInstruction(createDestinationAtaIx, tx),
    (tx) =>
      appendTransactionMessageInstruction(
        getTransferInstruction({
          source: sourceTokenAccount,
          destination: destinationTokenAccount,
          authority: FROM_KEYPAIR,
          amount: transferAmountWithDecimals,
        }),
        tx
      )
  );

  if (!transactionMessage) {
    throw new Error("Failed to create transaction message");
  }

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage
  );

  await sendAndConfirmTransaction(
    {
      ...signedTransaction,
      lifetimeConstraint: {
        lastValidBlockHeight,
      },
    },
    {
      commitment: "confirmed",
    }
  );

  console.log({ latestBlockhash, transactionMessage, signedTransaction });

  const signature = await getSignatureFromTransaction(signedTransaction);

  console.log(
    "\x1b[32m", //Green Text
    `   Transaction Success!🎉`,
    `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
}

sendTokens().catch(console.error);
