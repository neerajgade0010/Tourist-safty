require("@nomicfoundation/hardhat-ethers");
require("dotenv").config({ path: "../server/.env" });

module.exports = {
  solidity: "0.8.19",
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002,
    },
  },
};
