const hre = require("hardhat");

async function main() {
  const contractAddress = "0x62005A2c963e348e0E1b5b3c81aC78aB38b1AA7B";
  const channelId = 0;

  console.log("=== Creating Test Vote ===\n");
  console.log("Contract:", contractAddress);
  console.log("Channel ID:", channelId);

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);

  const question = "What do you think about this feature?";
  const options = ["Love it", "It's okay", "Needs improvement"];
  const duration = 7 * 24 * 60 * 60; // 7 days in seconds

  console.log("\nCreating vote...");
  console.log("Question:", question);
  console.log("Options:", options);
  console.log("Duration:", duration, "seconds (7 days)");

  const tx = await FHESocial.createVote(channelId, question, options, duration);
  console.log("\nTransaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("Vote created successfully!");
  console.log("Block number:", receipt.blockNumber);

  // Verify the vote was created
  const voteInfo = await FHESocial.getVoteInfo(channelId);
  console.log("\n=== Verification ===");
  console.log("Question:", voteInfo[0]);
  console.log("Options:", voteInfo[1]);
  console.log("Active:", voteInfo[4]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
