import { ethers } from "ethers";
import fs from "fs";

async function main() {
  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Hardhat default Account #0 private key (works on hardhat node)
  const PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Read compiled artifact (ABI + bytecode)
  const artifactPath =
    "./artifacts/contracts/SupplyChain.sol/SupplyChain.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Deploy
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  console.log("Deploying contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ SupplyChain deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});