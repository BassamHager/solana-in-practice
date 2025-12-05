import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { transferSol, sleep } from "../utils.js";

import {
  QUICKNODE_RPC,
  QUICKNODE_RPC_SUBSCRIPTIONS,
  SECOND_WALLET,
  SECOND_WALLET_KEYPAIR,
  TARGETED_OWNER_PUBKEY,
} from "./vars.js";

const solanaConnection = new Connection(QUICKNODE_RPC!, {
  wsEndpoint: QUICKNODE_RPC_SUBSCRIPTIONS!,
});

(async () => {
  const ACCOUNT_TO_WATCH = new PublicKey(SECOND_WALLET!);
  const subscriptionId = await solanaConnection.onAccountChange(
    ACCOUNT_TO_WATCH,
    (updatedAccountInfo) =>
      console.log(
        `---Event Notification for ${ACCOUNT_TO_WATCH.toString()}--- \nNew Account Balance:`,
        updatedAccountInfo.lamports / LAMPORTS_PER_SOL,
        " SOL"
      ),
    "confirmed"
  );
  console.log("Starting web socket, subscription ID: ", subscriptionId);

  await sleep(3000); //Wait 10 seconds for Socket Testing
  // await solanaConnection.requestAirdrop(ACCOUNT_TO_WATCH, LAMPORTS_PER_SOL);
  transferSol({
    connection: solanaConnection,
    from: SECOND_WALLET_KEYPAIR,
    to: new PublicKey(TARGETED_OWNER_PUBKEY!),
    amount: LAMPORTS_PER_SOL / 10,
  });

  await sleep(3000); //Wait 10 for Socket Testing
  await solanaConnection.removeAccountChangeListener(subscriptionId);
  console.log(`Websocket ID: ${subscriptionId} closed.`);
})();
