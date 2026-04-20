import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">SC</div>
        <div>
          <div className="title">SupplyChain</div>
          <div className="sub">Authenticity + QR Tracking</div>
        </div>
      </div>

      <div className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <span>📊 Dashboard</span>
          <span className="tag">Live</span>
        </NavLink>

        {/* Next pages we’ll build */}
        <NavLink to="/manufacturer" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🏭 Manufacturer</span>
          <span className="tag">Create + QR</span>
        </NavLink>

        <NavLink to="/distributor" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🚚 Distributor</span>
          <span className="tag">Scan</span>
        </NavLink>

        <NavLink to="/retailer" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>🏪 Retailer</span>
          <span className="tag">Sell</span>
        </NavLink>

        <NavLink to="/customer" className={({ isActive }) => (isActive ? "active" : "")}>
          <span>👤 Customer</span>
          <span className="tag">Verify</span>
        </NavLink>
      </div>

      <div className="alert" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Tip</div>
        <div className="small">
          Keep <b>Hardhat node</b> running on <b>8545</b> and switch MetaMask to <b>Hardhat Local (31337)</b>.
        </div>
      </div>
    </aside>
  );
}