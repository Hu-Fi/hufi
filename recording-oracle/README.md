# Recording Oracle

## 1. Overview

Recording Oracle is a backend service responsible for:
- Secure participant registration and management.
- Storing and validating read-only exchange API keys.
- Tracking campaign performance by fetching trading data from supported exchanges.
- Evaluating participant outcomes and writing validated results to escrow contracts.
- Exposing REST API endpoints for campaign progress, statistics, and health checks.

**Flow:**
1. Participants enroll by submitting exchange API keys.
2. The service fetches trading data and validates campaign participation.
3. Results are recorded and made available for payout by the Reputation Oracle.

## 2. API Reference

- The service exposes a REST API documented via Swagger.
- Common endpoints:
  - `/health/ping` – Service health info.
  - `/campaigns` – Campaign management and progress.
  - `/exchange-api-keys` – API key enrollment and management.
  - `/stats` – Volume statistics.

**Full API documentation:**
[Swagger UI](http://ro.hu.finance/swagger) - Latest API documentation deployed on production.

## 3. Prerequisites

- Node.js v22+
- Yarn
- PostgreSQL database
- S3-compatible storage (MinIO, AWS S3, etc.)
- RPC URLs for supported chains (Ethereum, Polygon, etc.)

## Environment variables

All required environment variables are listed in [.env.example](./.env.example).
You should copy this file to `.env` and fill in the values as needed.

Some variables may need extra explanation:

- `WEB3_PRIVATE_KEY`
  Private key for signing transactions on supported blockchains.
  **How to get:** Generate a new wallet using MetaMask, [ethers.js](https://docs.ethers.org), or another wallet tool.
  **Important:** Never use your main wallet/private key for testing.

- `RPC_URL_*`
  URLs for connecting to blockchain nodes (Ethereum, Polygon, etc.).
  **How to get:**
  - Use public endpoints (e.g., [Infura](https://infura.io/), [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/)), or run your own node.
  - Example: `RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/<your-key>`

- `ALCHEMY_API_KEY`
  API key for [Alchemy](https://www.alchemy.com/) node provider.
  **How to get:** Sign up at Alchemy, create an app, and copy your API key.

Other variables (database, S3, JWT, encryption, etc.) are pre-filled for local development, but should be changed for production deployments.

See [.env.example](./.env.example) for the full list and example values.

## 4. Running Locally

### 4.1. Start Database and S3

You can start PostgreSQL and MinIO (S3-compatible storage) using the provided scripts:

```sh
cd ../scripts
docker-compose up -d
```

This will start both services in the background.
- PostgreSQL will be available at `localhost:5432`
- MinIO will be available at `localhost:9000` (default credentials: `minioadmin:minioadmin`)


### 4.2. Install Dependencies

```sh
yarn install
```

### 4.3. Prepare Environment

Copy `.env.example` to `.env` and fill in required values.

### 4.4. Run Database Migrations

```sh
yarn typeorm migration:run
```

### 4.5. Start the Service

```sh
yarn start:dev
```

### 4.6. Access Swagger API Docs

[http://localhost:5101/swagger](http://localhost:5101/swagger)

---

For more details, see the [main project README](../README.md)