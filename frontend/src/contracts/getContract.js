import { ethers } from "ethers";
import ABI from "./SupplyChainABI.json";
import { CONTRACT_ADDRESS } from "./contractAddress";

export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  // Force latest selected MetaMask account
  await window.ethereum.request({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function getCurrentWalletAddress() {
  if (!window.ethereum) return "";

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return await signer.getAddress();
}