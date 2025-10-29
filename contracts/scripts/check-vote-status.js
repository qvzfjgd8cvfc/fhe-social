const hre = require("hardhat");

async function main() {
  const FHESocialVoting = await hre.ethers.getContractAt(
    "FHESocialVoting",
    "0x87b2eEE655D41b07d4dF8124F0B601636F45808e"
  );

  const VotingManager = await hre.ethers.getContractAt(
    "VotingManager",
    "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28"
  );

  console.log("Checking vote status for channel 1...\n");

  try {
    // Get vote info
    const voteInfo = await VotingManager.getVoteInfo(1);
    console.log("Vote Info:");
    console.log("- Question:", voteInfo[0]);
    console.log("- Options:", voteInfo[1]);
    console.log("- Is Multi Choice:", voteInfo[2]);
    console.log("- Created At:", voteInfo[3].toString());
    console.log("- Active:", voteInfo[4]);
    console.log();

    // Check if user has voted
    const testAddress = "0xdc82296843f8a3a630d3F9d960297abfC207d173"; // Example address
    const hasVoted = await VotingManager.hasVoted(1, testAddress);
    console.log("Has user voted:", hasVoted);
    console.log();

    // Get total channels
    const totalChannels = await FHESocialVoting.totalChannels();
    console.log("Total channels:", totalChannels.toString());
  } catch (error) {
    console.error("Error checking vote status:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
