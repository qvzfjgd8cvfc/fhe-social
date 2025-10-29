const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy contracts to local Hardhat network for testing
 * This allows testing without FHE relayer dependency
 */
async function main() {
  console.log("🚀 Starting local deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy UserRegistry
  console.log("1️⃣  Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("✅ UserRegistry:", userRegistryAddress);

  // Deploy ChannelManagerSimple
  console.log("\n2️⃣  Deploying ChannelManagerSimple...");
  const ChannelManager = await hre.ethers.getContractFactory("ChannelManagerSimple");
  const channelManager = await ChannelManager.deploy();
  await channelManager.waitForDeployment();
  const channelManagerAddress = await channelManager.getAddress();
  console.log("✅ ChannelManagerSimple:", channelManagerAddress);

  // Deploy MessageManagerSimple
  console.log("\n3️⃣  Deploying MessageManagerSimple...");
  const MessageManager = await hre.ethers.getContractFactory("MessageManagerSimple");
  const messageManager = await MessageManager.deploy();
  await messageManager.waitForDeployment();
  const messageManagerAddress = await messageManager.getAddress();
  console.log("✅ MessageManagerSimple:", messageManagerAddress);

  // Deploy VotingManager
  console.log("\n4️⃣  Deploying VotingManager...");
  const VotingManager = await hre.ethers.getContractFactory("VotingManager");
  const votingManager = await VotingManager.deploy();
  await votingManager.waitForDeployment();
  const votingManagerAddress = await votingManager.getAddress();
  console.log("✅ VotingManager:", votingManagerAddress);

  // Deploy FHESocialVoting
  console.log("\n5️⃣  Deploying FHESocialVoting...");
  const FHESocial = await hre.ethers.getContractFactory("FHESocialVoting");
  const fheSocial = await FHESocial.deploy(
    channelManagerAddress,
    messageManagerAddress,
    userRegistryAddress,
    votingManagerAddress
  );
  await fheSocial.waitForDeployment();
  const fheSocialAddress = await fheSocial.getAddress();
  console.log("✅ FHESocialVoting:", fheSocialAddress);

  // Setup authorizations
  console.log("\n6️⃣  Setting up authorizations...");
  await userRegistry.setAuthorization(fheSocialAddress, true);
  console.log("✅ UserRegistry authorized");

  await channelManager.setAuthorization(fheSocialAddress, true);
  console.log("✅ ChannelManagerSimple authorized");

  await messageManager.setAuthorization(fheSocialAddress, true);
  console.log("✅ MessageManagerSimple authorized");

  await votingManager.setAuthorization(fheSocialAddress, true);
  console.log("✅ VotingManager authorized");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    FHESocialVoting: fheSocialAddress,
    UserRegistry: userRegistryAddress,
    ChannelManagerSimple: channelManagerAddress,
    MessageManagerSimple: messageManagerAddress,
    VotingManager: votingManagerAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📋 === Deployment Summary ===");
  console.log("FHESocialVoting:      ", fheSocialAddress);
  console.log("UserRegistry:         ", userRegistryAddress);
  console.log("ChannelManagerSimple: ", channelManagerAddress);
  console.log("MessageManagerSimple: ", messageManagerAddress);
  console.log("VotingManager:        ", votingManagerAddress);
  console.log("\n💾 Deployment saved to: deployments/localhost.json");

  // Create test data
  console.log("\n7️⃣  Creating test data...");

  // Register deployer
  await fheSocial.registerUser("TestUser");
  console.log("✅ Registered user: TestUser");

  // Create a test channel with vote
  const tx = await fheSocial.createChannelWithVote(
    "Welcome to FHE Social",
    "A privacy-preserving social platform powered by FHE",
    "Do you like FHE encryption?",
    ["Yes, it's amazing!", "No, too complex", "Need to learn more"],
    false
  );
  await tx.wait();
  console.log("✅ Created test channel with voting");

  console.log("\n🎉 Local deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend .env with these addresses");
  console.log("2. Start frontend: cd ../frontend && yarn dev");
  console.log("3. Test without FHE relayer dependency!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
