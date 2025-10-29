const hre = require("hardhat");

async function main() {
  const fheSocial = await hre.ethers.getContractAt(
    "FHESocialVoting",
    "0x87b2eEE655D41b07d4dF8124F0B601636F45808e"
  );

  const votingManager = await hre.ethers.getContractAt(
    "VotingManager",
    "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28"
  );

  console.log("Checking all channels and their votes...\n");

  // Check channels 0-3
  for (let i = 0; i <= 3; i++) {
    console.log(`=== Channel ${i} ===`);

    try {
      const channelData = await fheSocial.getChannel(i);
      console.log("Channel data:");
      console.log("  Name:", channelData[0] || "(empty)");
      console.log("  Description:", channelData[1] || "(empty)");
      console.log("  Creator:", channelData[2]);
      console.log("  Message count:", channelData[4].toString());

      // Check vote
      const voteInfo = await votingManager.getVoteInfo(i);
      console.log("Vote data:");
      console.log("  Question:", voteInfo[0] || "(no vote)");
      console.log("  Options:", voteInfo[1].length > 0 ? voteInfo[1] : "(no options)");
      console.log("  Active:", voteInfo[4]);
      console.log();
    } catch (error) {
      console.log("  Error:", error.message);
      console.log();
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
