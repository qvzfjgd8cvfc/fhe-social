const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of FHESocialSimple...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy UserRegistry
  console.log("\n1. Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry deployed to:", userRegistryAddress);

  // Wait between deployments
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy ChannelManagerSimple
  console.log("\n2. Deploying ChannelManagerSimple...");
  const ChannelManager = await hre.ethers.getContractFactory("ChannelManagerSimple");
  const channelManager = await ChannelManager.deploy();
  await channelManager.waitForDeployment();
  const channelManagerAddress = await channelManager.getAddress();
  console.log("ChannelManagerSimple deployed to:", channelManagerAddress);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy MessageManagerSimple
  console.log("\n3. Deploying MessageManagerSimple...");
  const MessageManager = await hre.ethers.getContractFactory("MessageManagerSimple");
  const messageManager = await MessageManager.deploy();
  await messageManager.waitForDeployment();
  const messageManagerAddress = await messageManager.getAddress();
  console.log("MessageManagerSimple deployed to:", messageManagerAddress);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy FHESocialSimple
  console.log("\n4. Deploying FHESocialSimple...");
  const FHESocial = await hre.ethers.getContractFactory("FHESocialSimple");
  const fheSocial = await FHESocial.deploy(
    channelManagerAddress,
    messageManagerAddress,
    userRegistryAddress
  );
  await fheSocial.waitForDeployment();
  const fheSocialAddress = await fheSocial.getAddress();
  console.log("FHESocialSimple deployed to:", fheSocialAddress);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Setup authorizations
  console.log("\n5. Setting up authorizations...");

  console.log("Authorizing FHESocialSimple in UserRegistry...");
  const tx1 = await userRegistry.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx1.wait();
  console.log("✓ UserRegistry authorization set");

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Authorizing FHESocialSimple in ChannelManagerSimple...");
  const tx2 = await channelManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx2.wait();
  console.log("✓ ChannelManagerSimple authorization set");

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Authorizing FHESocialSimple in MessageManagerSimple...");
  const tx3 = await messageManager.setAuthorization(fheSocialAddress, true, {gasLimit: 100000});
  await tx3.wait();
  console.log("✓ MessageManagerSimple authorization set");

  // Save deployment info
  const deploymentInfo = {
    FHESocialSimple: fheSocialAddress,
    UserRegistry: userRegistryAddress,
    ChannelManagerSimple: channelManagerAddress,
    MessageManagerSimple: messageManagerAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia-simple.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log("FHESocialSimple:", fheSocialAddress);
  console.log("UserRegistry:", userRegistryAddress);
  console.log("ChannelManagerSimple:", channelManagerAddress);
  console.log("MessageManagerSimple:", messageManagerAddress);
  console.log("\nDeployment info saved to deployments/sepolia-simple.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
