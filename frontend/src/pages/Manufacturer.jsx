import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { getContract } from "../contracts/getContract";
import { CONTRACT_ADDRESS } from "../contracts/contractAddress";

const HARDHAT_CHAIN_ID = "0x7a69";

function Card({ title, children }) {
  return (
    <div className="card" style={{ gridColumn: "span 12" }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function Manufacturer({ account, chainId }) {
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isHardhat = chainId === HARDHAT_CHAIN_ID;

  const qrPayload = useMemo(() => {
    return {
      serial: serial.trim(),
      contract: CONTRACT_ADDRESS,
      chainId: chainId || HARDHAT_CHAIN_ID,
      type: "SCM_AUTH",
    };
  }, [serial, chainId]);

  async function createOnChain() {
    try {
      setBusy(true);
      setMsg({ type: "", text: "" });
      setTxHash("");
      setQrDataUrl("");
      setStatus(null);

      const s = serial.trim();

      if (!s) {
        setMsg({ type: "danger", text: "Please enter a serial number" });
        return;
      }

      if (!account) {
        setMsg({ type: "danger", text: "Please connect MetaMask first" });
        return;
      }

      if (!isHardhat) {
        setMsg({ type: "danger", text: "Please switch to Hardhat Local network" });
        return;
      }

      const contract = await getContract();

      // 1. Create product on blockchain
      const tx = await contract.createProduct(s);
      setTxHash(tx.hash);

      await tx.wait();

      // 2. Generate QR immediately after successful transaction
      const qrString = JSON.stringify({
        serial: s,
        contract: CONTRACT_ADDRESS,
        chainId: chainId || HARDHAT_CHAIN_ID,
        type: "SCM_AUTH",
      });

      const qr = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
      });

      setQrDataUrl(qr);

      // 3. Try verifyProduct separately
      try {
        const p = await contract.verifyProduct(s);

        setStatus({
          serial: p[0],
          manufacturer: p[1],
          distributor: p[2],
          retailer: p[3],
          stage: Number(p[4]),
        });

        setMsg({
          type: "ok",
          text: "Product created successfully and QR generated",
        });
      } catch (verifyErr) {
        setMsg({
          type: "ok",
          text: "Product created and QR generated. But on-chain fetch failed (ABI/address mismatch may exist).",
        });
      }
    } catch (e) {
      setMsg({
        type: "danger",
        text: e?.shortMessage || e?.reason || e?.message || "Transaction failed",
      });
    } finally {
      setBusy(false);
    }
  }

  function downloadQR() {
    if (!qrDataUrl) {
      setMsg({ type: "danger", text: "QR not generated yet" });
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${serial.trim()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="grid">
      <Card title="Create Product + Generate QR">
        <p>
          Manufacturer registers each product on blockchain using a unique serial number.
        </p>

        <div className="inputRow">
          <input
            className="input"
            placeholder="Enter serial (ex: PROD001)"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />

          <button className="btn btnPrimary" onClick={createOnChain} disabled={busy}>
            {busy ? "Creating..." : "Create on Blockchain"}
          </button>

          <button className="btn" onClick={downloadQR} disabled={!qrDataUrl}>
            Download QR
          </button>
        </div>

        <div className="small" style={{ marginTop: 10 }}>
          Contract: <b>{CONTRACT_ADDRESS}</b>
        </div>

        {msg.text && (
          <div
            className={`alert ${
              msg.type === "ok" ? "ok" : msg.type === "danger" ? "danger" : ""
            }`}
            style={{ marginTop: 12 }}
          >
            {msg.text}
            {txHash && (
              <div className="small" style={{ marginTop: 8 }}>
                Tx Hash: <b>{txHash}</b>
              </div>
            )}
          </div>
        )}

        {status && (
          <div className="alert" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>On-chain Record</div>
            <div className="small"><b>Serial:</b> {status.serial}</div>
            <div className="small"><b>Manufacturer:</b> {status.manufacturer}</div>
            <div className="small"><b>Distributor:</b> {status.distributor}</div>
            <div className="small"><b>Retailer:</b> {status.retailer}</div>
            <div className="small"><b>Status:</b> {status.stage} (0 = Created)</div>
          </div>
        )}

        {qrDataUrl && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Generated QR</div>
            <img
              src={qrDataUrl}
              alt="Generated QR"
              style={{
                width: 240,
                height: 240,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.16)",
              }}
            />

            <div className="alert" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>QR Payload</div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(qrPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}