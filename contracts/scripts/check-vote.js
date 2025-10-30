const hre = require("hardhat");

async function main() {
  const contractAddress = "0x62005A2c963e348e0E1b5b3c81aC78aB38b1AA7B";
  const channelId = 0;

  console.log("=== Checking Vote Info ===\n");
  console.log("Contract:", contractAddress);
  console.log("Channel ID:", channelId);

  const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);

  try {
    const voteInfo = await FHESocial.getVoteInfo(channelId);
    console.log("\nVote Info:");
    console.log("Question:", voteInfo[0]);
    console.log("Options:", voteInfo[1]);
    console.log("Start Time:", new Date(Number(voteInfo[2]) * 1000).toLocaleString());
    console.log("End Time:", new Date(Number(voteInfo[3]) * 1000).toLocaleString());
    console.log("Active:", voteInfo[4]);
  } catch (error) {
    console.error("Error reading vote info:", error.message);
  }

  // Also check channel info
  try {
    const channel = await FHESocial.getChannel(channelId);
    console.log("\nChannel Info:");
    console.log("Name:", channel[0]);
    console.log("Description:", channel[1]);
    console.log("Creator:", channel[2]);
    console.log("Created At:", new Date(Number(channel[3]) * 1000).toLocaleString());
    console.log("Active:", channel[4]);
  } catch (error) {
    console.error("Error reading channel:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
