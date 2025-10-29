const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of FHESocialVoting...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy UserRegistry
  console.log("\n1. Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry:", userRegistryAddress);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy ChannelManagerSimple
  console.log("\n2. Deploying ChannelManagerSimple...");
  const ChannelManager = await hre.ethers.getContractFactory("ChannelManagerSimple");
  const channelManager = await ChannelManager.deploy();
  await channelManager.waitForDeployment();
  const channelManagerAddress = await channelManager.getAddress();
  console.log("ChannelManagerSimple:", channelManagerAddress);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy MessageManagerSimple
  console.log("\n3. Deploying MessageManagerSimple...");
  const MessageManager = await hre.ethers.getContractFactory("MessageManagerSimple");
  const messageManager = await MessageManager.deploy();
  await messageManager.waitForDeployment();
  const messageManagerAddress = await messageManager.getAddress();
  console.log("MessageManagerSimple:", messageManagerAddress);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy VotingManager
  console.log("\n4. Deploying VotingManager...");
  const VotingManager = await hre.ethers.getContractFactory("VotingManager");
  const votingManager = await VotingManager.deploy();
  await votingManager.waitForDeployment();
  const votingManagerAddress = await votingManager.getAddress();
  console.log("VotingManager:", votingManagerAddress);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy FHESocialVoting
  console.log("\n5. Deploying FHESocialVoting...");
  const FHESocial = await hre.ethers.getContractFactory("FHESocialVoting");
  const fheSocial = await FHESocial.deploy(
    channelManagerAddress,
    messageManagerAddress,
    userRegistryAddress,
    votingManagerAddress
  );
  await fheSocial.waitForDeployment();
  const fheSocialAddress = await fheSocial.getAddress();
  console.log("FHESocialVoting:", fheSocialAddress);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Setup authorizations
  console.log("\n6. Setting up authorizations...");

  console.log("Authorizing FHESocialVoting in UserRegistry...");
  const tx1 = await userRegistry.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx1.wait();
  console.log("✓ UserRegistry");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Authorizing FHESocialVoting in ChannelManagerSimple...");
  const tx2 = await channelManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx2.wait();
  console.log("✓ ChannelManagerSimple");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Authorizing FHESocialVoting in MessageManagerSimple...");
  const tx3 = await messageManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx3.wait();
  console.log("✓ MessageManagerSimple");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Authorizing FHESocialVoting in VotingManager...");
  const tx4 = await votingManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx4.wait();
  console.log("✓ VotingManager");

  // Save deployment info
  const deploymentInfo = {
    FHESocialVoting: fheSocialAddress,
    UserRegistry: userRegistryAddress,
    ChannelManagerSimple: channelManagerAddress,
    MessageManagerSimple: messageManagerAddress,
    VotingManager: votingManagerAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia-voting.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log("FHESocialVoting:", fheSocialAddress);
  console.log("UserRegistry:", userRegistryAddress);
  console.log("ChannelManagerSimple:", channelManagerAddress);
  console.log("MessageManagerSimple:", messageManagerAddress);
  console.log("VotingManager:", votingManagerAddress);
  console.log("\nDeployment saved to deployments/sepolia-voting.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
