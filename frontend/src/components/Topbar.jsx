import { ethers } from "ethers";

function shortAddr(a) {
  return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
}

const HARDHAT_CHAIN_ID = "0x7a69"; // 31337

export default function Topbar({ title, subtitle, account, chainId, onConnect, onSwitchNetwork, error }) {
  const ok = chainId === HARDHAT_CHAIN_ID;

  return (
    <div className="topbar">
      <div className="top-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="actions">
        <span className="badge">
          <span className={`dot ${ok ? "ok" : "bad"}`} />
          {chainId ? (ok ? "Hardhat Local" : `Wrong network: ${chainId}`) : "No chain"}
        </span>

        <span className="badge">
          <span className={`dot ${account ? "ok" : ""}`} />
          {account ? shortAddr(account) : "Not connected"}
        </span>

        {!account ? (
          <button className="btn btnPrimary" onClick={onConnect}>Connect</button>
        ) : (
          !ok && <button className="btn btnPrimary" onClick={onSwitchNetwork}>Switch Network</button>
        )}
      </div>

      {error ? (
        <div className="alert danger" style={{ position: "absolute", top: 84, right: 22, width: 360 }}>
          <b>Error:</b> {error}
        </div>
      ) : null}
    </div>
  );
}