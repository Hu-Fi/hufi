# Reputation Oracle

## 1. Overview

Reputation Oracle is a backend service responsible for:
- Finalizing campaign outcomes and calculating participant rewards.
- Verifying and aggregating results recorded by the Recording Oracle.
- Executing on-chain payouts to campaign participants via smart contracts.
- Running as a CLI process or GitHub Action for automated, reproducible, and transparent reward distribution.

**Flow:**
1. Reputation Oracle fetches validated campaign results from storage (S3, blockchain, etc.).
2. It verifies participant performance and calculates reward allocations.
3. Payouts are executed on-chain using the Human Protocol smart contracts.
4. The process runs to completion and then exits.

## 2. Prerequisites

- Node.js v18+
- Yarn
- S3-compatible storage (MinIO, AWS S3, etc.)
- RPC URLs for supported chains (Ethereum, Polygon, etc.)
- Access to validated campaign results (from Recording Oracle)

## Environment variables

All required environment variables are listed in [.env.example](./.env.example).
Copy this file to `.env` and fill in the values as needed.
q
Some variables may need extra explanation:

- `WEB3_PRIVATE_KEY`
  Private key for signing payout transactions on supported blockchains.
  **How to get:** Generate a new wallet using MetaMask, [ethers.js](https://docs.ethers.org), or another wallet tool.  
  **Important:** Never use your main wallet/private key for testing.

- `RPC_URL_*`
  URLs for connecting to blockchain nodes (Ethereum, Polygon, etc.).
  **How to get:**
  - Use public endpoints (e.g., [Infura](https://infura.io/), [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/)), or run your own node.
  - Example: `RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/<your-key>`

Other variables (S3, logging, payout config, etc.) are pre-filled for local development, but should be changed for production deployments.

See [.env.example](./.env.example) for the full list and example values.

## 3. Running Locally

### 3.1. Start S3 Storage

You can start MinIO (S3-compatible storage) using the provided scripts:

```sh
cd ../scripts
docker-compose up -d
```

MinIO will be available at `localhost:9000` (default credentials: `minioadmin:minioadmin`).

### 3.2. Install Dependencies

```sh
yarn install
```

### 3.3. Prepare Environment

Copy `.env.example` to `.env` and fill in required values.

### 3.4. Run the Service

```sh
yarn start
```

This will execute the payout cycle once and exit.

## 4. Running as a GitHub Action

Reputation Oracle is designed to run as a GitHub Action for automated reward distribution.
See [../.github/workflows/run-reputation-oracle.yaml](../.github/workflows/run-reputation-oracle.yaml) for the workflow configuration.

---

For more