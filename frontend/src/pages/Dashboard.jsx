export default function Dashboard({ account, chainId }) {
  const ok = chainId === "0x7a69";

  return (
    <div className="grid">
      <div className="card">
        <h2>Network Status</h2>
        <div className="kpi">
          <div>
            <div className="num">{ok ? "✅" : "❌"}</div>
            <div className="label">{ok ? "Hardhat Local Connected" : "Switch to Hardhat Local"}</div>
          </div>
          <div className="badge">
            <span className={`dot ${ok ? "ok" : "bad"}`} />
            {chainId || "-"}
          </div>
        </div>
        <p style={{ marginTop: 10 }}>
          Your smart contract is deployed locally. All role actions will update blockchain history.
        </p>
      </div>

      <div className="card">
        <h2>Quick Guide</h2>
        <p>
          1) Manufacturer creates product serial and generates QR <br />
          2) Distributor scans QR and updates status <br />
          3) Retailer scans QR and marks sold <br />
          4) Customer scans QR to verify genuine vs fake
        </p>
        <div className="alert ok" style={{ marginTop: 12 }}>
          This is exactly how industry anti-counterfeit workflows are shown in demos.
        </div>
      </div>

      <div className="card">
        <h2>Connected Wallet</h2>
        <div className="kpi">
          <div>
            <div className="num">{account ? "1" : "0"}</div>
            <div className="label">Active wallet session</div>
          </div>
          <div className="badge">
            <span className={`dot ${account ? "ok" : ""}`} />
            {account ? "Connected" : "Not connected"}
          </div>
        </div>
        <p style={{ marginTop: 10 }}>
          We’ll map this address to roles (Manufacturer/Distributor/Retailer/Customer) next.
        </p>
      </div>

      <div className="card">
        <h2>Live Actions</h2>
        <p>
          Next page: <b>Manufacturer</b> will have a form to create serial → generate QR image → download.
        </p>
        <div className="alert" style={{ marginTop: 12 }}>
          After that, Distributor/Retailer pages will include a real camera QR scanner.
        </div>
      </div>
    </div>
  );
}