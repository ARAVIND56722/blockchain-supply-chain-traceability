import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Hardhat node Account #0 private key (default)
  const PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // ✅ Put your deployed contract address here
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const artifactPath = "./artifacts/contracts/SupplyChain.sol/SupplyChain.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  console.log("Creating product PROD001...");
  const tx = await contract.createProduct("PROD001");
  await tx.wait();
  console.log("✅ Product created. Tx:", tx.hash);

  const data = await contract.verifyProduct("PROD001");
  console.log("✅ verifyProduct(PROD001) =>", data);
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});