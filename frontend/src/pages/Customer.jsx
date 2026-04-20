import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getContract } from "../contracts/getContract";

const HARDHAT_CHAIN_ID = "0x7a69";

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

  if (s === 0) return "Created";
  if (s === 1) return "With Distributor";
  if (s === 2) return "With Retailer";
  if (s === 3) return "Sold";

  return "Unknown";
}

export default function Customer({ chainId }) {

  const [serial, setSerial] = useState("");
  const [scanText, setScanText] = useState("");
  const [product, setProduct] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const isHardhat = chainId === HARDHAT_CHAIN_ID;

  const parsedSerial = useMemo(() => {
    try {
      if (!scanText) return "";
      const obj = JSON.parse(scanText);
      if (obj?.serial) return obj.serial;
      return "";
    } catch {
      return scanText;
    }
  }, [scanText]);

  useEffect(() => {
    if (parsedSerial) setSerial(parsedSerial);
  }, [parsedSerial]);

 async function startScan() {

  stopScan(); // reset previous scanner

  try {

    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();

    const deviceId = devices[0].deviceId;

    const codeReader = new BrowserMultiFormatReader();

    codeReaderRef.current = codeReader;

    setScanning(true);

    await codeReader.decodeFromVideoDevice(
      deviceId,
      videoRef.current,
      (result) => {

        if (result) {

          setScanText(result.getText());

          stopScan();
        }
      }
    );

  } catch (err) {

    setScanning(false);

    setMsg({
      type: "danger",
      text: "Camera access failed"
    });
  }
}

  function stopScan() {
  try {

    // stop ZXing scanner
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    // stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

  } catch (error) {
    console.log("Scanner stop error:", error);
  }

  setScanning(false);
}
 async function verifyProduct() {
  try {
    const s = serial.trim();

    if (!s) {
      setMsg({ type: "danger", text: "Enter or scan serial first" });
      return;
    }

    if (!isHardhat) {
      setMsg({ type: "danger", text: "Switch MetaMask to Hardhat Local network" });
      return;
    }

    const contract = await getContract();

    const p = await contract.verifyProduct(s);

    // Extra frontend safety check
    if (
      !p[0] ||
      p[0].trim() === "" ||
      p[1] === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Product does not exist");
    }

    setProduct({
      serial: p[0],
      manufacturer: p[1],
      distributor: p[2],
      retailer: p[3],
      stage: Number(p[4])
    });

    setMsg({
      type: "ok",
      text: "Product Verified ✅ Genuine Product"
    });

  } catch (err) {
    setProduct(null);

    setMsg({
      type: "danger",
      text: "Product not found in blockchain ❌ Possible Fake Product"
    });
  }
}

  return (
    <div className="grid">

      <Card title="Customer Product Verification">

        <div className="inputRow">

          <button className="btn btnPrimary" onClick={startScan}>
            {scanning ? "Scanning..." : "Scan Product QR"}
          </button>

          <button className="btn" onClick={stopScan}>
            Stop
          </button>

        </div>

        <div style={{ marginTop: 20 }}>

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: 320,
              height: 240,
              borderRadius: 12,
              border: "1px solid #ccc"
            }}
          />

        </div>

        <div className="inputRow" style={{ marginTop: 20 }}>

          <input
            className="input"
            placeholder="Serial Number"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />

          <button className="btn" onClick={verifyProduct}>
            Verify Product
          </button>

        </div>

        {msg.text && (
          <div className={`alert ${msg.type}`}>
            {msg.text}
          </div>
        )}

        {product && (

          <div className="alert ok">

            <p><b>Serial:</b> {product.serial}</p>
            <p><b>Manufacturer:</b> {product.manufacturer}</p>
            <p><b>Distributor:</b> {product.distributor}</p>
            <p><b>Retailer:</b> {product.retailer}</p>
            <p><b>Status:</b> {stageLabel(product.stage)}</p>

          </div>

        )}

      </Card>

    </div>
  );
}