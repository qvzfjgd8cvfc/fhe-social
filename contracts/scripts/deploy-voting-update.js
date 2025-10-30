const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploying Updated FHESocialVoting (No Registration Required) ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Use existing module addresses
  const userRegistryAddress = "0x908fd8D16daC60f1DD52E24edA460781eD1B0aDD";
  const channelManagerAddress = "0x55Ae9dE3e4e2994c3861e1BE7E8781593c9bCceA";
  const messageManagerAddress = "0xbB7Ca0941260F8e5bd2D07217158e7cd885b79B0";
  const votingManagerAddress = "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28";

  console.log("\nReusing existing modules:");
  console.log("UserRegistry:", userRegistryAddress);
  console.log("ChannelManager:", channelManagerAddress);
  console.log("MessageManager:", messageManagerAddress);
  console.log("VotingManager:", votingManagerAddress);

  // Deploy new FHESocialVoting
  console.log("\nDeploying FHESocialVoting...");
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
  console.log("\n=== Setting up authorizations ===");

  const UserRegistry = await hre.ethers.getContractAt("UserRegistry", userRegistryAddress);
  const ChannelManager = await hre.ethers.getContractAt("ChannelManagerSimple", channelManagerAddress);
  const MessageManager = await hre.ethers.getContractAt("MessageManagerSimple", messageManagerAddress);
  const VotingManager = await hre.ethers.getContractAt("VotingManager", votingManagerAddress);

  console.log("\n1. Authorizing new FHESocialVoting in UserRegistry...");
  const tx1 = await UserRegistry.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx1.wait();
  console.log("✓ Done");

  console.log("2. Authorizing new FHESocialVoting in ChannelManager...");
  const tx2 = await ChannelManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx2.wait();
  console.log("✓ Done");

  console.log("3. Authorizing new FHESocialVoting in MessageManager...");
  const tx3 = await MessageManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx3.wait();
  console.log("✓ Done");

  console.log("4. Authorizing new FHESocialVoting in VotingManager...");
  const tx4 = await VotingManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx4.wait();
  console.log("✓ Done");

  // Save deployment info
  const deploymentInfo = {
    FHESocialVoting: fheSocialAddress,
    UserRegistry: userRegistryAddress,
    ChannelManagerSimple: channelManagerAddress,
    MessageManagerSimple: messageManagerAddress,
    VotingManager: votingManagerAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    note: "Updated: Removed user registration requirement for voting"
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia-voting-updated.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log("New FHESocialVoting:", fheSocialAddress);
  console.log("\n⚠️ Update frontend .env with:");
  console.log(`VITE_CONTRACT_ADDRESS=${fheSocialAddress}`);
  console.log("\nDeployment saved to deployments/sepolia-voting-updated.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
