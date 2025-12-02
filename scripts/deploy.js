const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of FHESocial (v0.9.1)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy FHESocial
  console.log("Deploying FHESocial...");
  const FHESocial = await hre.ethers.getContractFactory("FHESocial");
  const fheSocial = await FHESocial.deploy();
  await fheSocial.waitForDeployment();
  const fheSocialAddress = await fheSocial.getAddress();
  console.log("FHESocial deployed to:", fheSocialAddress);

  // Save deployment info
  const deploymentInfo = {
    FHESocial: fheSocialAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    version: "0.9.1"
  };

  fs.writeFileSync(
    path.join(__dirname, "..", `deployment-${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "../frontend/.env");
  const envContent = `# FHESocial Contract Address (deployed ${new Date().toISOString()})
VITE_CONTRACT_ADDRESS=${fheSocialAddress}

# Network Configuration
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("\nFrontend .env updated");

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FHESocial.sol/FHESocial.json");
  const frontendAbiPath = path.join(__dirname, "../frontend/src/contracts/FHESocial.json");

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(frontendAbiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
    console.log("Frontend ABI updated");
  }

  console.log("\n=== Deployment Complete ===");
  console.log("FHESocial:", fheSocialAddress);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
