import web3 from "@solana/web3.js";

const transferSol = async ({
  connection,
  from,
  to,
  amount /* eg: web3.LAMPORTS_PER_SOL / 100 */,
}: {
  connection: web3.Connection;
  from: web3.Keypair;
  to: web3.PublicKey;
  amount: number;
}) => {
  console.log({ from, to, amount });

  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount,
    })
  );

  // Sign transaction, broadcast, and confirm
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [from]
  );
  console.log("SIGNATURE", signature);
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export { transferSol, sleep };
