const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const votingManager = await hre.ethers.getContractAt(
    "VotingManager",
    "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28"
  );

  const fheSocial = await hre.ethers.getContractAt(
    "FHESocialVoting",
    "0x87b2eEE655D41b07d4dF8124F0B601636F45808e"
  );

  console.log("Deployer:", deployer.address);
  console.log();

  // Check if channel 1 exists
  try {
    const channelData = await fheSocial.getChannel(1);
    console.log("Channel 1 exists:");
    console.log("- Name:", channelData[0]);
    console.log("- Description:", channelData[1]);
    console.log();
  } catch (error) {
    console.log("Channel 1 does not exist");
    console.log();
  }

  // Check current vote status
  console.log("Checking vote status for channel 1...");
  const voteInfo = await votingManager.getVoteInfo(1);
  console.log("Current vote:");
  console.log("- Question:", voteInfo[0]);
  console.log("- Options:", voteInfo[1]);
  console.log("- Active:", voteInfo[4]);
  console.log();

  // If vote doesn't exist, try to create one manually
  if (!voteInfo[4]) {
    console.log("Vote doesn't exist. Creating test vote...");
    try {
      const tx = await votingManager.createVote(
        1,
        "Do you like FHE encryption?",
        ["Yes", "No", "Maybe"],
        false,
        { gasLimit: 500000 }
      );
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Vote created successfully!");

      // Check again
      const newVoteInfo = await votingManager.getVoteInfo(1);
      console.log("\nNew vote info:");
      console.log("- Question:", newVoteInfo[0]);
      console.log("- Options:", newVoteInfo[1]);
      console.log("- Active:", newVoteInfo[4]);
    } catch (error) {
      console.error("Failed to create vote:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
