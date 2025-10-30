const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploying FHESocial Contract ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "\n");

  // Deploy FHESocial
  console.log("Deploying FHESocial...");
  const FHESocial = await hre.ethers.getContractFactory("FHESocial");
  const fheSocial = await FHESocial.deploy();
  await fheSocial.waitForDeployment();

  const contractAddress = await fheSocial.getAddress();
  console.log("FHESocial deployed to:", contractAddress);

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}-latest.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log("\n=== Deployment Complete ===");
  console.log("Contract Address:", contractAddress);
  console.log("\n⚠️ Update frontend .env with:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
