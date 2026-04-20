import "./styles/app.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Manufacturer from "./pages/Manufacturer";
import Distributor from "./pages/Distributor";
import Retailer from "./pages/Retailer";
import Customer from "./pages/Customer";

const HARDHAT_CHAIN_ID = "0x7a69"; // 31337

export default function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [error, setError] = useState("");

  const syncWalletState = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAccount(accounts?.[0] || "");
      setChainId(currentChainId || "");
    } catch (e) {
      setError(e?.message || "Failed to sync wallet state");
    }
  }, []);

 async function connect() {
  try {
    setError("");

    if (!window.ethereum) {
      setError("MetaMask not found");
      return;
    }

    const selectedAccounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    setAccount(selectedAccounts?.[0] || "");
    setChainId(currentChainId || "");
  } catch (e) {
    setError(e?.message || "Connect failed");
  }
}

  async function switchToHardhat() {
    try {
      setError("");

      if (!window.ethereum) {
        setError("MetaMask not found");
        return;
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });

      await syncWalletState();
    } catch (e) {
      if (e?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: HARDHAT_CHAIN_ID,
                chainName: "Hardhat Local",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });

          await syncWalletState();
        } catch (e2) {
          setError(e2?.message || "Failed to add Hardhat network");
        }
      } else {
        setError(e?.message || "Failed to switch network");
      }
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || "");
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId || "");
    };

    const handleFocus = async () => {
      await syncWalletState();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    syncWalletState();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }

      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [syncWalletState]);

  const topbarProps = {
    title: "SCM Authenticity Tracker",
    subtitle: "Industry-style dashboard • blockchain audit trail • QR verification",
    account,
    chainId,
    onConnect: connect,
    onSwitchNetwork: switchToHardhat,
    error,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout topbarProps={topbarProps}>
              <Dashboard account={account} chainId={chainId} />
            </Layout>
          }
        />

        <Route
          path="/manufacturer"
          element={
            <Layout topbarProps={topbarProps}>
              <Manufacturer account={account} chainId={chainId} />
            </Layout>
          }
        />

        <Route
          path="/distributor"
          element={
            <Layout topbarProps={topbarProps}>
              <Distributor account={account} chainId={chainId} />
            </Layout>
          }
        />

        <Route
          path="/retailer"
          element={
            <Layout topbarProps={topbarProps}>
              <Retailer account={account} chainId={chainId} />
            </Layout>
          }
        />

        <Route
          path="/customer"
          element={
            <Layout topbarProps={topbarProps}>
              <Customer chainId={chainId} />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}