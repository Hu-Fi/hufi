# Campaign Launcher Server

## 1. Overview

Campaign Launcher Server is a backend service responsible for:
- Aggregating and serving campaign data from blockchain and off-chain (such as subgraph) sources.
- Managing campaign discovery.
- Providing REST API endpoints for campaign management, statistics, and health checks.
- Connecting the Campaign Launcher Client with blockchain and subgraph data.

> **Note:** Participant enrollment (such as registration and API key management) is handled by the Recording Oracle service, not by the Campaign Launcher Server.

**Flow:**
1. Users interact with the Campaign Launcher Client to create or join campaigns.
2. The server fetches and aggregates campaign data from smart contracts and subgraph.
3. API endpoints expose campaign information, participant status, and statistics.

## 2. API Reference

- The service exposes a REST API documented via Swagger.
- Common endpoints:
  - `/health/ping` – Service health info.
  - `/campaigns` – Campaign management and discovery.
  - `/exchanges` – Supported exchanges info.
  - `/statistics` – Campaign statistics.

**Full API documentation:**
[Swagger UI](http://localhost:5100/swagger) - Latest API documentation when running locally.

## 3. Prerequisites

- Node.js v18+
- Yarn
- RPC URLs for supported chains (Ethereum, Polygon, etc.)

## Environment variables

All required environment variables are listed in [.env.example](./.env.example).
Copy this file to `.env` and fill in the values as needed.

Some variables may need extra explanation:

- `EXCHANGE_ORACLE`
  Address for the Campaign Launcher Server itself.
  **How to get:** Use the deployed contract address for the Campaign Launcher Server.

- `RECORDING_ORACLE`
  Wallet address (public key) for the Recording Oracle service.
  **How to get:** Use the private key associated with your Recording Oracle deployment.

- `REPUTATION_ORACLE`
  Wallet address (public key)  for the Reputation Oracle service.
  **How to get:** Use the private key associated with your Reputation Oracle deployment.

> **Note:** These variables are not pre-filled in `.env.example` and must be provided for proper operation.

- `RPC_URL_*`
  URLs for connecting to blockchain nodes (Ethereum, Polygon, etc.).
  **How to get:**
  - Use public endpoints (e.g., [Infura](https://infura.io/), [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/)), or run your own node.
  - Example: `RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/<your-key>`

- `ALCHEMY_API_KEY`
  API key for [Alchemy](https://www.alchemy.com/) node provider.
  **How to get:** Sign up at Alchemy, create an app, and copy your API key.

Other variables (logging, etc.) are pre-filled for local development, but should be changed for production deployments.

See [.env.example](./.env.example) for the full list and example values.

## 4. Running Locally

### 4.1. Install Dependencies

```sh
yarn install
```

### 4.2. Prepare Environment

Copy `.env.example` to `.env` and fill in required values.

### 4.3. Start the Service

```sh
yarn start:dev
```

### 4.4. Access Swagger API Docs

[http://localhost:5100/swagger](http://localhost:5100/swagger)

---

For more details, see