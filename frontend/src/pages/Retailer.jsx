import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getContract, getCurrentWalletAddress } from "../contracts/getContract";

const HARDHAT_CHAIN_ID = "0x7a69"; // 31337

function Card({ title, children }) {
  return (
    <div className="card" style={{ gridColumn: "span 12" }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function stageLabel(stageNum) {
  const s = Number(stageNum);
  if (s === 0) return "0 (Created)";
  if (s === 1) return "1 (WithDistributor)";
  if (s === 2) return "2 (WithRetailer)";
  if (s === 3) return "3 (Sold)";
  return String(s);
}

export default function Retailer({ account, chainId }) {
  const [serial, setSerial] = useState("");
  const [scanText, setScanText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [product, setProduct] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [retailerAddress, setRetailerAddress] = useState("");
  const [actualSignerAddress, setActualSignerAddress] = useState("");

  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const isHardhat = chainId === HARDHAT_CHAIN_ID;

  const parsedSerial = useMemo(() => {
    try {
      if (!scanText) return "";
      const obj = JSON.parse(scanText);
      if (obj?.serial) return String(obj.serial);
      return "";
    } catch {
      return scanText?.trim() || "";
    }
  }, [scanText]);

  useEffect(() => {
    if (parsedSerial) setSerial(parsedSerial);
  }, [parsedSerial]);

  useEffect(() => {
    syncSigner();
  }, [account, chainId]);

  async function syncSigner() {
    try {
      const addr = await getCurrentWalletAddress();
      setActualSignerAddress(addr || "");
    } catch {
      setActualSignerAddress("");
    }
  }

  async function startScan() {
    try {
      setMsg({ type: "", text: "" });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMsg({
          type: "danger",
          text: "Camera API not supported in this browser.",
        });
        return;
      }

      if (!videoRef.current) {
        setMsg({
          type: "danger",
          text: "Video preview element not found.",
        });
        return;
      }

      await navigator.mediaDevices.getUserMedia({ video: true });

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices || devices.length === 0) {
        setMsg({
          type: "danger",
          text: "No camera device found.",
        });
        return;
      }

      const selectedDeviceId = devices[0].deviceId;

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      setScanning(true);
      setMsg({ type: "ok", text: "Camera started. Show the QR to the camera." });

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result) {
            const text = result.getText();
            setScanText(text);
            setMsg({ type: "ok", text: "QR scanned successfully ✅" });
            stopScan();
          }
        }
      );
    } catch (error) {
      setScanning(false);
      setMsg({
        type: "danger",
        text:
          error?.message ||
          "Failed to access camera. Please allow permission or use manual paste.",
      });
    }
  }

  function stopScan() {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    } catch {}

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  async function fetchProduct() {
    try {
      setMsg({ type: "", text: "" });
      setProduct(null);

      const s = serial.trim();
      if (!s) {
        setMsg({ type: "danger", text: "Enter or scan a serial first." });
        return;
      }

      if (!isHardhat) {
        setMsg({ type: "danger", text: "Switch MetaMask to Hardhat Local (31337)." });
        return;
      }

      setBusy(true);

      const contract = await getContract();
      const p = await contract.verifyProduct(s);

      setProduct({
        serial: p[0],
        manufacturer: p[1],
        distributor: p[2],
        retailer: p[3],
        stage: Number(p[4]),
      });

      await syncSigner();

      setMsg({ type: "ok", text: "On-chain product loaded ✅" });
    } catch (e) {
      setMsg({
        type: "danger",
        text: e?.shortMessage || e?.reason || e?.message || "Fetch failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function sendToRetailer() {
    try {
      setMsg({ type: "", text: "" });
      setTxHash("");

      const s = serial.trim();
      if (!s) {
        setMsg({ type: "danger", text: "Serial is required." });
        return;
      }

      if (!account) {
        setMsg({ type: "danger", text: "Connect MetaMask first." });
        return;
      }

      if (!isHardhat) {
        setMsg({ type: "danger", text: "Switch to Hardhat Local (31337)." });
        return;
      }

      const retailAddr = retailerAddress.trim();
      if (!retailAddr) {
        setMsg({ type: "danger", text: "Enter retailer wallet address." });
        return;
      }

      if (!product) {
        setMsg({ type: "danger", text: "Load on-chain product data first." });
        return;
      }

      await syncSigner();

      const signerAddr = (await getCurrentWalletAddress()).toLowerCase();
      const expectedDistributor = product.distributor.toLowerCase();

      if (signerAddr !== expectedDistributor) {
        setMsg({
          type: "danger",
          text: `Wrong wallet connected. Current signer: ${signerAddr} | Expected distributor: ${expectedDistributor}`,
        });
        return;
      }

      if (Number(product.stage) !== 1) {
        setMsg({
          type: "danger",
          text: `Invalid stage. Current stage is ${stageLabel(product.stage)}. Expected 1 (WithDistributor).`,
        });
        return;
      }

      setBusy(true);

      const contract = await getContract();
      const tx = await contract.sendToRetailer(s, retailAddr);
      setTxHash(tx.hash);

      await tx.wait();
      await fetchProduct();

      setMsg({ type: "ok", text: "Sent to Retailer ✅" });
    } catch (e) {
      setMsg({
        type: "danger",
        text: e?.shortMessage || e?.reason || e?.message || "Transaction failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function markSold() {
    try {
      setMsg({ type: "", text: "" });
      setTxHash("");

      const s = serial.trim();
      if (!s) {
        setMsg({ type: "danger", text: "Serial is required." });
        return;
      }

      if (!account) {
        setMsg({ type: "danger", text: "Connect MetaMask first." });
        return;
      }

      if (!isHardhat) {
        setMsg({ type: "danger", text: "Switch to Hardhat Local (31337)." });
        return;
      }

      if (!product) {
        setMsg({ type: "danger", text: "Load on-chain product data first." });
        return;
      }

      await syncSigner();

      const signerAddr = (await getCurrentWalletAddress()).toLowerCase();
      const expectedRetailer = product.retailer.toLowerCase();

      if (signerAddr !== expectedRetailer) {
        setMsg({
          type: "danger",
          text: `Wrong wallet connected. Current signer: ${signerAddr} | Expected retailer: ${expectedRetailer}`,
        });
        return;
      }

      if (Number(product.stage) !== 2) {
        setMsg({
          type: "danger",
          text: `Invalid stage. Current stage is ${stageLabel(product.stage)}. Expected 2 (WithRetailer).`,
        });
        return;
      }

      setBusy(true);

      const contract = await getContract();
      const tx = await contract.markSold(s);
      setTxHash(tx.hash);

      await tx.wait();
      await fetchProduct();

      setMsg({ type: "ok", text: "Product marked as Sold ✅" });
    } catch (e) {
      setMsg({
        type: "danger",
        text: e?.shortMessage || e?.reason || e?.message || "Transaction failed",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <Card title="Retailer Scan + Load Product">
        <p>Scan the product QR code to load the blockchain record.</p>

        <div className="inputRow">
          <button className="btn btnPrimary" onClick={startScan} disabled={busy || scanning}>
            {scanning ? "Scanning..." : "Start Camera Scan"}
          </button>

          <button className="btn" onClick={stopScan} disabled={!scanning}>
            Stop
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div
            style={{
              width: 320,
              minHeight: 260,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.16)",
              background: "rgba(255,255,255,.04)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 16,
                display: scanning ? "block" : "none",
              }}
            />
            {!scanning && <div className="small">Camera preview appears here</div>}
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="small" style={{ marginBottom: 8 }}>
              Paste QR content (JSON or Serial)
            </div>

            <textarea
              className="input"
              style={{ minHeight: 120 }}
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              placeholder='{"serial":"PROD015","contract":"0x...","chainId":"0x7a69","type":"SCM_AUTH"}'
            />

            <div className="inputRow" style={{ marginTop: 10 }}>
              <input
                className="input"
                placeholder="Serial (auto-filled from QR)"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />

              <button className="btn" onClick={fetchProduct} disabled={busy}>
                {busy ? "Loading..." : "Load On-chain Data"}
              </button>
            </div>
          </div>
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

        <div className="alert" style={{ marginTop: 12 }}>
          <div className="small"><b>Topbar account prop:</b> {account || "-"}</div>
          <div className="small"><b>Actual signer from MetaMask:</b> {actualSignerAddress || "-"}</div>
        </div>

        {product && (
          <div className="alert" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>On-chain record</div>
            <div className="small"><b>Serial:</b> {product.serial}</div>
            <div className="small"><b>Manufacturer:</b> {product.manufacturer}</div>
            <div className="small"><b>Distributor:</b> {product.distributor}</div>
            <div className="small"><b>Retailer:</b> {product.retailer}</div>
            <div className="small"><b>Status:</b> {stageLabel(product.stage)}</div>
          </div>
        )}
      </Card>

      <Card title="Distributor action: Send to Retailer">
        <p>Only the Distributor wallet can send the product to the Retailer.</p>

        <div className="inputRow">
          <input
            className="input"
            placeholder="Retailer wallet address"
            value={retailerAddress}
            onChange={(e) => setRetailerAddress(e.target.value)}
          />

          <button className="btn btnPrimary" onClick={sendToRetailer} disabled={busy}>
            {busy ? "Sending..." : "Send to Retailer"}
          </button>
        </div>
      </Card>

      <Card title="Retailer action: Mark Product as Sold">
        <p>Only the Retailer wallet can mark the product as sold.</p>

        <div className="inputRow">
          <button className="btn btnPrimary" onClick={markSold} disabled={busy}>
            {busy ? "Updating..." : "Mark as Sold"}
          </button>
        </div>
      </Card>
    </div>
  );
}