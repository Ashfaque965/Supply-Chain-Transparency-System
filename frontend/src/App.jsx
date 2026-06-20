import { useEffect, useState } from "react";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [createForm, setCreateForm] = useState({
    name: "",
    origin: "",
    supplierAddress: "",
    amountEth: "0.01",
    batchId: "",
    certifier: ""
  });
  const [advanceId, setAdvanceId] = useState("");
  const [verifyId, setVerifyId] = useState("");

  const [createResult, setCreateResult] = useState(null);
  const [advanceResult, setAdvanceResult] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("productId");
    if (id) {
      setVerifyId(id);
      verifyProduct(id);
    }
  }, []);

  const onCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreateResult(null);

    try {
      const response = await fetch(`${apiBase}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          origin: createForm.origin,
          supplierAddress: createForm.supplierAddress,
          amountEth: createForm.amountEth,
          metadata: {
            batchId: createForm.batchId,
            certifier: createForm.certifier
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create product");
      }

      setCreateResult(data);
      if (data.productId !== undefined && data.productId !== null) {
        setVerifyId(String(data.productId));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const advanceStage = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAdvanceResult(null);

    try {
      const response = await fetch(`${apiBase}/products/${advanceId}/advance`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to advance stage");
      }
      setAdvanceResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyProduct = async (idFromAction) => {
    const targetId = idFromAction || verifyId;
    if (!targetId) {
      return;
    }

    setLoading(true);
    setError("");
    setVerifyResult(null);

    try {
      const response = await fetch(`${apiBase}/verify/${targetId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify product");
      }
      setVerifyResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <h1>Supply Chain Transparency System</h1>
      <p className="subtitle">Source → Warehouse → Retailer with automated delivery payment and customer QR verification.</p>

      <section className="card">
        <h2>Create Product</h2>
        <form onSubmit={createProduct} className="grid">
          <input name="name" placeholder="Product name" value={createForm.name} onChange={onCreateChange} required />
          <input name="origin" placeholder="Origin source" value={createForm.origin} onChange={onCreateChange} required />
          <input name="supplierAddress" placeholder="Supplier wallet address" value={createForm.supplierAddress} onChange={onCreateChange} required />
          <input name="amountEth" placeholder="Escrow ETH (e.g. 0.01)" value={createForm.amountEth} onChange={onCreateChange} required />
          <input name="batchId" placeholder="Batch ID" value={createForm.batchId} onChange={onCreateChange} />
          <input name="certifier" placeholder="Certifier" value={createForm.certifier} onChange={onCreateChange} />
          <button disabled={loading} type="submit">Create on Chain</button>
        </form>
        {createResult && (
          <div className="result">
            <div>Product ID: {createResult.productId}</div>
            <div>TX: {createResult.txHash}</div>
            <div>IPFS CID: {createResult.ipfsCid || "not set"}</div>
            <a href={createResult.verifyUrl} target="_blank" rel="noreferrer">Verification URL</a>
            {createResult.qrDataUrl && <img alt="Product QR" src={createResult.qrDataUrl} />}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Advance Stage</h2>
        <form onSubmit={advanceStage} className="row">
          <input placeholder="Product ID" value={advanceId} onChange={(event) => setAdvanceId(event.target.value)} required />
          <button disabled={loading} type="submit">Advance</button>
        </form>
        {advanceResult && <div className="result">TX: {advanceResult.txHash}</div>}
      </section>

      <section className="card">
        <h2>Verify Product</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            verifyProduct();
          }}
          className="row"
        >
          <input placeholder="Product ID" value={verifyId} onChange={(event) => setVerifyId(event.target.value)} required />
          <button disabled={loading} type="submit">Verify</button>
        </form>
        {verifyResult && (
          <div className="result">
            <div>Verified: {String(verifyResult.verified)}</div>
            <div>Name: {verifyResult.product.name}</div>
            <div>Origin: {verifyResult.product.origin}</div>
            <div>Stage: {verifyResult.product.stageLabel}</div>
            <div>Paid: {String(verifyResult.product.paid)}</div>
            <div>Batch: {verifyResult.metadata?.batchId || "n/a"}</div>
            <div>Certifier: {verifyResult.metadata?.certifier || "n/a"}</div>
          </div>
        )}
      </section>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
