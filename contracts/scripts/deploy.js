const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting FHE Social deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. Deploy UserRegistry
  console.log("1. Deploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("✅ UserRegistry deployed to:", userRegistryAddress, "\n");

  // 2. Deploy ChannelManager
  console.log("2. Deploying ChannelManager...");
  const ChannelManager = await ethers.getContractFactory("ChannelManager");
  const channelManager = await ChannelManager.deploy();
  await channelManager.waitForDeployment();
  const channelManagerAddress = await channelManager.getAddress();
  console.log("✅ ChannelManager deployed to:", channelManagerAddress, "\n");

  // 3. Deploy MessageManager
  console.log("3. Deploying MessageManager...");
  const MessageManager = await ethers.getContractFactory("MessageManager");
  const messageManager = await MessageManager.deploy();
  await messageManager.waitForDeployment();
  const messageManagerAddress = await messageManager.getAddress();
  console.log("✅ MessageManager deployed to:", messageManagerAddress, "\n");

  // 4. Deploy FHESocialV2 (main contract)
  console.log("4. Deploying FHESocialV2...");
  const FHESocialV2 = await ethers.getContractFactory("FHESocialV2");
  const fheSocial = await FHESocialV2.deploy(
    channelManagerAddress,
    messageManagerAddress,
    userRegistryAddress
  );
  await fheSocial.waitForDeployment();
  const fheSocialAddress = await fheSocial.getAddress();
  console.log("✅ FHESocialV2 deployed to:", fheSocialAddress, "\n");

  // 5. Set up authorization - FHESocialV2 can call all modules
  console.log("5. Setting up authorization...");

  console.log("  - Authorizing FHESocialV2 on UserRegistry...");
  await userRegistry.setAuthorization(fheSocialAddress, true);
  console.log("  ✅ Authorization set\n");

  console.log("  - Authorizing FHESocialV2 on ChannelManager...");
  await channelManager.setAuthorization(fheSocialAddress, true);
  console.log("  ✅ Authorization set\n");

  console.log("  - Authorizing FHESocialV2 on MessageManager...");
  await messageManager.setAuthorization(fheSocialAddress, true);
  console.log("  ✅ Authorization set\n");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FHESocialV2: fheSocialAddress,
      UserRegistry: userRegistryAddress,
      ChannelManager: channelManagerAddress,
      MessageManager: messageManagerAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath, "\n");

  // Update frontend .env file
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");
  const envContent = `# FHE Social Contract Addresses
VITE_CONTRACT_ADDRESS=${fheSocialAddress}
VITE_USER_REGISTRY_ADDRESS=${userRegistryAddress}
VITE_CHANNEL_MANAGER_ADDRESS=${channelManagerAddress}
VITE_MESSAGE_MANAGER_ADDRESS=${messageManagerAddress}

# Network Configuration
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✅ Frontend .env file updated\n");

  // Print summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\n📝 Contract Addresses:");
  console.log("  FHESocialV2:      ", fheSocialAddress);
  console.log("  UserRegistry:     ", userRegistryAddress);
  console.log("  ChannelManager:   ", channelManagerAddress);
  console.log("  MessageManager:   ", messageManagerAddress);
  console.log("\n✅ All contracts deployed and authorized successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
