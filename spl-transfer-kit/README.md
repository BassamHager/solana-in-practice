# SPL Token Transfer Script (Solana • TypeScript)

This repository contains a TypeScript script for transferring SPL tokens on Solana Devnet.
It uses Solana Kit (v2) and the Token Program to safely move tokens between wallets, automatically handle Associated Token Accounts (ATAs), and fetch token metadata such as decimals.

---

## 🚀 Features

SPL token transfer using Solana Kit (v2 API)

Automatic creation of missing ATAs

Fetches token decimals for accurate transfer amounts

Devnet airdrop for the signer (optional)

Clean functional-style transaction building (using pipe())

---

## 📁 Project Structure
```
.
├── app.ts        # Main script (transfer logic)
├── package.json
└── README.md
```

---

## 🛠 Installation
```
git clone https://github.com/BassamHager/transfer-spl-token.git
cd transfer-spl-token
npm install
```

---

Make sure you have TypeScript and ts-node installed:
```
npm install -g typescript ts-node
```

If needed, initialize TS config:
```
tsc --init
```
---

## ⚙️ Configuration

Update the variables in __app.ts__:

- RPC endpoints
- Source wallet secret key
- Destination wallet address
- Token mint address
- Transfer amount

__Example:__
```
const DESTINATION_WALLET = address("...");
const MINT_ADDRESS = address("...");
const TRANSFER_AMOUNT = 1n;
```

Your local signer is loaded from a secret key array stored in the script.

---
## ▶️ Usage

Run the script:
```
ts-node app.ts
```

On success, you’ll see a Solana Explorer URL containing the transaction signature.
---

## 📌 Notes

- This project is designed for Devnet usage.
- The private key included in this repo must never be used for production.
- Solana Kit v2 requires "module": "NodeNext" in tsconfig.json.

---
## 📝 License
MIT