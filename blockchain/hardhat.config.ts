import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-ignition-ethers";

export default defineConfig({
  solidity: {
    version: "0.8.28",
  },
});