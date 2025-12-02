const { QUICKNODE_RPC, KEYPAIR_SECRET } = require("./vars.js");

//sendSol.js
const web3 = require("@solana/web3.js");
// Connect to cluster
const connection = new web3.Connection(QUICKNODE_RPC, "confirmed");

// Generate a Keypair to send from
const from = web3.Keypair.fromSecretKey(new Uint8Array(KEYPAIR_SECRET));

// Generate a random address to send to
const to = web3.Keypair.generate();

// 
(async () => {
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: web3.LAMPORTS_PER_SOL / 100,
    })
  );

  // Sign transaction, broadcast, and confirm
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [from]
  );
  console.log("SIGNATURE", signature);
})();
