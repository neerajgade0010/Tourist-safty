const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying TouristRegistry to Mumbai Testnet...");

  const TouristRegistry = await hre.ethers.getContractFactory("TouristRegistry");
  const contract = await TouristRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ TouristRegistry deployed at: ${address}`);

  const artifact = await hre.artifacts.readArtifact("TouristRegistry");

  const deploymentInfo = {
    address,
    abi: artifact.abi,
    network: "mumbai",
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Saved to blockchain/deployment.json`);
  console.log(`\n👉 Add to server/.env:\nCONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
