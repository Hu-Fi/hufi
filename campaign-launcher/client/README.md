# Campaign Launcher Client

## 1. Overview

Campaign Launcher Client is a web-based interface for HuFi, enabling users to create, join, and manage market-making campaigns directly from their wallet (e.g., MetaMask).
It interacts with Human Protocol smart contracts and HuFi backend services to display live campaign data, manage participant enrollment, and provide a seamless campaign management experience.

**Flow:**
1. Users connect their wallet and sign in using supported providers (e.g., MetaMask, WalletConnect).
2. The dashboard displays available campaigns, which users can filter and explore.
3. To launch a new campaign, users specify campaign parameters and deploy the campaign contract via the interface.
4. To join an existing campaign, users submit their read-only exchange API keys securely through the client.
5. The client communicates with recording oracle to enroll participants and validate API keys.
6. Participants can monitor campaign progress, view statistics, and track their own performance in real time.
7. Users can manage their exchange API keys, switch networks, and view campaign results directly from the dashboard.

## 2. Features

- Campaign discovery and filtering (active, joined, my campaigns)
- Launch new market-making campaigns
- Join campaigns with read-only exchange API keys
- Track campaign statistics and progress
- Manage API keys for supported exchanges
- Responsive UI with support for multiple networks

## 3. Prerequisites

- Node.js v18+
- Yarn

## 4. Environment variables

All required environment variables are listed in [.env.example](./.env.example).
Copy this file to `.env` and fill in the values as needed.

## 5. Running Locally

### 5.1. Install Dependencies

```sh
yarn install
```

### 5.2. Prepare Environment

Copy `.env.example` to `.env` and fill in required values.

### 5.3. Start the Development Server

```sh
yarn dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

## 6. API Reference

The client interacts with:
- [Campaign Launcher Server](../server/README.md)
- [Recording Oracle](../../recording-oracle/README.md)

See those READMEs for backend API details.

---

For more details, see the [main project README](../../README.md)