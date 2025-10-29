const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking contract authorizations...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { FHESocialV2, UserRegistry, ChannelManager, MessageManager } = deployment.contracts;

  console.log("Contract Addresses:");
  console.log("  FHESocialV2:", FHESocialV2);
  console.log("  UserRegistry:", UserRegistry);
  console.log("  ChannelManager:", ChannelManager);
  console.log("  MessageManager:", MessageManager);
  console.log();

  // Get contract instances
  const userRegistry = await ethers.getContractAt("UserRegistry", UserRegistry);
  const channelManager = await ethers.getContractAt("ChannelManager", ChannelManager);
  const messageManager = await ethers.getContractAt("MessageManager", MessageManager);

  // Check authorizations
  console.log("Checking authorizations...");

  const userRegistryAuth = await userRegistry.authorized(FHESocialV2);
  console.log("  UserRegistry → FHESocialV2:", userRegistryAuth ? "✅ Authorized" : "❌ NOT Authorized");

  const channelManagerAuth = await channelManager.authorized(FHESocialV2);
  console.log("  ChannelManager → FHESocialV2:", channelManagerAuth ? "✅ Authorized" : "❌ NOT Authorized");

  const messageManagerAuth = await messageManager.authorized(FHESocialV2);
  console.log("  MessageManager → FHESocialV2:", messageManagerAuth ? "✅ Authorized" : "❌ NOT Authorized");

  console.log();

  if (!userRegistryAuth || !channelManagerAuth || !messageManagerAuth) {
    console.log("⚠️  Some authorizations are missing!");
    console.log("\nTo fix, run:");
    console.log("  npx hardhat run scripts/fix-authorizations.js --network sepolia");
  } else {
    console.log("✅ All authorizations are correctly set!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
