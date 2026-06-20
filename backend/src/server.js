import "dotenv/config";
import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import { createProductOnChain, advanceStageOnChain, getProductFromChain } from "./blockchain.js";
import { uploadJsonToIpfs, readJsonFromIpfs } from "./ipfs.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;
const verifyBaseUrl = process.env.PUBLIC_VERIFY_BASE_URL || "http://localhost:5173/verify";

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/products", async (req, res) => {
  try {
    const { name, origin, supplierAddress, amountEth, metadata } = req.body;

    if (!name || !origin || !supplierAddress || !amountEth) {
      return res.status(400).json({ error: "name, origin, supplierAddress and amountEth are required" });
    }

    const fullMetadata = {
      ...metadata,
      name,
      origin,
      createdAt: new Date().toISOString()
    };

    const cid = await uploadJsonToIpfs(fullMetadata);
    const chainResult = await createProductOnChain({
      name,
      origin,
      cid,
      supplierAddress,
      amountEth: String(amountEth)
    });

    const verifyUrl = `${verifyBaseUrl}?productId=${chainResult.productId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    return res.status(201).json({
      productId: chainResult.productId,
      txHash: chainResult.txHash,
      ipfsCid: cid,
      verifyUrl,
      qrDataUrl
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/products/:id/advance", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const result = await advanceStageOnChain(productId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await getProductFromChain(productId);
    const metadata = product.ipfsCid ? await readJsonFromIpfs(product.ipfsCid) : null;

    return res.json({
      ...product,
      metadata
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/products/:id/qr", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const verifyUrl = `${verifyBaseUrl}?productId=${productId}`;
    const dataUrl = await QRCode.toDataURL(verifyUrl);

    return res.json({
      productId,
      verifyUrl,
      qrDataUrl: dataUrl
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/verify/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const product = await getProductFromChain(productId);
    const metadata = product.ipfsCid ? await readJsonFromIpfs(product.ipfsCid) : null;

    return res.json({
      verified: true,
      product,
      metadata
    });
  } catch (error) {
    return res.status(500).json({
      verified: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
