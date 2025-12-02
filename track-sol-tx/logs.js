const { SECOND_WALLET, QUICKNODE_RPC } = require("./vars.js");

const solanaWeb3 = require("@solana/web3.js");
// const searchAddress = SECOND_WALLET; //example 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg'

// connection
const endpoint = QUICKNODE_RPC;
const solanaConnection = new solanaWeb3.Connection(endpoint);

const getTransactions = async (address, numTx) => {
  const pubKey = new solanaWeb3.PublicKey(address);
  let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, {
    limit: numTx,
  });

  let signatureList = transactionList.map(
    (transaction) => transaction.signature
  );
  let transactionDetails = await solanaConnection.getParsedTransactions(
    signatureList,
    { maxSupportedTransactionVersion: 0 }
  );

  transactionList.forEach((transaction, i) => {
    console.log(`Transaction No: ${i + 1}`);
    console.log(`Signature: ${transaction.signature}`);
    const date = new Date(transaction.blockTime * 1000);
    console.log(`Time: ${date}`);
    console.log(`Status: ${transaction.confirmationStatus}`);
    const transactionInstructions =
      transactionDetails[i].transaction.message.instructions;
    transactionInstructions.forEach((instruction, n) => {
      console.log(
        `---Instructions ${n + 1}: ${instruction.programId.toString()}`
      );
    });
    console.log("-".repeat(20));
  });
};

getTransactions(SECOND_WALLET, 3);
