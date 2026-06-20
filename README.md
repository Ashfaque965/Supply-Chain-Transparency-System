# Supply Chain Transparency System

Track product movement from source → warehouse → retailer, automate settlement using smart contracts, and let customers verify provenance using QR codes.

## Stack

- Ethereum (Hardhat + Solidity)
- Node.js + Express API
- React (Vite)
- IPFS (metadata storage)

## Architecture

1. Backend receives product registration details.
2. Metadata is uploaded to IPFS and CID is captured.
3. Smart contract stores product + escrowed payment.
4. Stage transitions move Source → Warehouse → Retailer → Delivered.
5. On Delivered, escrow is released automatically to supplier.
6. Backend generates verification URL and QR code.
7. Customer scans QR and verifies chain + IPFS data.

## Project Structure

- `contracts/` Solidity contract + Hardhat setup
- `backend/` Express API + blockchain/IPFS integration
- `frontend/` React UI for operator and customer verification

## Quick Start

### 1) Smart Contracts

```bash
cd contracts
npm install
npx hardhat node
```

In another terminal:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

Copy deployed contract address.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set in `.env`:

- `CONTRACT_ADDRESS` from deployment output
- `PRIVATE_KEY` from a local Hardhat account
- `IPFS_*` values (Infura or your IPFS node)

Run:

```bash
npm run dev
```

### 3) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## API Endpoints

- `GET /health`
- `POST /products`
- `POST /products/:id/advance`
- `GET /products/:id`
- `GET /products/:id/qr`
- `GET /verify/:id`

## Hyperledger Fabric Alternative

This MVP uses Ethereum. If you want Fabric instead, the same API/UI contract can be kept while replacing:

- Solidity contract → Fabric chaincode
- Ethers integration → Fabric SDK gateway logic
