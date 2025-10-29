const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get user address from environment or default
  const userAddress = process.env.USER_ADDRESS || "0xdC82296843f8a3a30d0C2aa36196b085c0c4d456";

  console.log("Checking user registration...");
  console.log("User Address:", userAddress);
  console.log();

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { FHESocialV2 } = deployment.contracts;

  // Get contract instance
  const fheSocial = await ethers.getContractAt("FHESocialV2", FHESocialV2);

  try {
    // Check user profile
    const profile = await fheSocial.getUserProfile(userAddress);

    console.log("User Profile:");
    console.log("  Username:", profile[0]);
    console.log("  Registered At:", new Date(Number(profile[1]) * 1000).toLocaleString());
    console.log("  Message Count:", profile[2].toString());
    console.log("  Channel Count:", profile[3].toString());
    console.log("  Exists:", profile[4] ? "✅ Yes" : "❌ No");
    console.log();

    if (!profile[4]) {
      console.log("❌ User is not registered!");
      console.log("Please register first before creating channels.");
    } else {
      console.log("✅ User is registered and can create channels!");
    }
  } catch (error) {
    console.error("Error checking user:", error.message);
  }

  // Get stats
  try {
    const stats = await fheSocial.getStats();
    console.log("\nPlatform Stats:");
    console.log("  Total Users:", stats[0].toString());
    console.log("  Total Channels:", stats[1].toString());
    console.log("  Total Messages:", stats[2].toString());
  } catch (error) {
    console.error("Error getting stats:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
