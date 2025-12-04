// const { config } = require("dotenv");
// if (config().error) {
//   throw new Error("Error loading .env file");
// }
// config();
import dotenv from "dotenv";

dotenv.config();

// keypair for 2nd
const KEYPAIR_SECRET = [
  137, 86, 129, 45, 160, 55, 190, 232, 26, 87, 162, 43, 184, 0, 227, 77, 150,
  241, 254, 53, 23, 190, 56, 223, 91, 4, 10, 117, 177, 140, 196, 101, 221, 51,
  55, 218, 17, 129, 94, 136, 73, 105, 198, 158, 227, 249, 41, 240, 180, 168, 41,
  82, 41, 101, 155, 227, 186, 160, 155, 79, 122, 240, 214, 146,
];

// env variables
const {
  QUICKNODE_RPC,
  QUICKNODE_RPC_SUBSCRIPTIONS,
  TARGETED_OWNER_PUBKEY,
  MINT_ADD_USDC_DUMMY,
} = process.env;

if (!QUICKNODE_RPC) {
  throw new Error("QUICKNODE_RPC is not defined");
}

if (!QUICKNODE_RPC_SUBSCRIPTIONS) {
  throw new Error("QUICKNODE_RPC_SUBSCRIPTIONS is not defined");
}

if (!TARGETED_OWNER_PUBKEY) {
  throw new Error("TARGETED_OWNER_PUBKEY is not defined");
}

if (!MINT_ADD_USDC_DUMMY) {
  throw new Error("MINT_ADD_USDC_DUMMY is not defined");
}

export {
  KEYPAIR_SECRET,
  QUICKNODE_RPC,
  QUICKNODE_RPC_SUBSCRIPTIONS,
  TARGETED_OWNER_PUBKEY,
  MINT_ADD_USDC_DUMMY,
};
