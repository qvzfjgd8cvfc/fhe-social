const hre = require("hardhat");

async function main() {
  const contractAddress = "0x25BA9ce62D9e7853AfFE4be2c1638c8351aE77E5";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);

  const name = "Test Channel";
  const description = "Test Description";
  const question = "Do you like this?";
  const options = ["Yes", "No", "Maybe"];
  const duration = 7 * 24 * 60 * 60; // 7 days in seconds

  console.log("\nParameters:");
  console.log("Name:", name);
  console.log("Description:", description);
  console.log("Question:", question);
  console.log("Options:", options);
  console.log("Duration (seconds):", duration);
  console.log("Duration (hours):", duration / 3600);
  console.log("Duration (days):", duration / 86400);

  console.log("\nCalling createChannelWithVote...");
  const tx = await FHESocial.createChannelWithVote(name, description, question, options, duration);
  console.log("TX hash:", tx.hash);
  
  await tx.wait();
  console.log("Success!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
