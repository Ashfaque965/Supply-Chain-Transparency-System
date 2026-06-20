import "dotenv/config";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const stageLabels = ["Source", "Warehouse", "Retailer", "Delivered"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractAbiPath = path.join(__dirname, "contractAbi.json");
const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, "utf8"));

const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl || !privateKey || !contractAddress) {
  throw new Error("Missing required blockchain environment variables");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

export async function createProductOnChain({ name, origin, cid, supplierAddress, amountEth }) {
  const tx = await contract.createProduct(name, origin, cid, supplierAddress, {
    value: ethers.parseEther(amountEth)
  });

  const receipt = await tx.wait();
  const createdLog = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "ProductCreated");

  const productId = createdLog ? Number(createdLog.args.productId) : null;

  return {
    txHash: receipt.hash,
    productId
  };
}

export async function advanceStageOnChain(productId) {
  const tx = await contract.advanceStage(productId);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash
  };
}

export async function getProductFromChain(productId) {
  const product = await contract.getProduct(productId);

  return {
    id: Number(product.id),
    name: product.name,
    origin: product.origin,
    ipfsCid: product.ipfsCid,
    amountWei: product.amountWei.toString(),
    payer: product.payer,
    supplier: product.supplier,
    stage: Number(product.stage),
    stageLabel: stageLabels[Number(product.stage)] || "Unknown",
    paid: product.paid
  };
}
