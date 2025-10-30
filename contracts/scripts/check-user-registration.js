const hre = require("hardhat");

async function main() {
  const inputAddress = (process.env.USER_ADDRESS || "0xdc82296843f8a3a30d0C2aa36196b085c0c4d456").toLowerCase();
  const userAddress = hre.ethers.getAddress(inputAddress);

  console.log("=== Checking User Registration ===\n");
  console.log("User address:", userAddress);

  const votingAddress = "0x87b2eEE655D41b07d4dF8124F0B601636F45808e";

  const FHESocial = await hre.ethers.getContractFactory("FHESocialVoting");
  const fheSocial = FHESocial.attach(votingAddress);

  try {
    const userProfile = await fheSocial.getUserProfile(userAddress);
    console.log("\nUser Profile:");
    console.log("  Username:", userProfile[0] || "(empty)");
    console.log("  Registered At:", userProfile[1].toString());
    console.log("  Message Count:", userProfile[2].toString());
    console.log("  Channel Count:", userProfile[3].toString());
    console.log("  Exists:", userProfile[4]);

    if (!userProfile[4]) {
      console.log("\n❌ User is NOT registered!");
      console.log("\nTo register, user must call:");
      console.log(`  fheSocial.registerUser("username")`);
    } else {
      console.log("\n✅ User is registered!");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
