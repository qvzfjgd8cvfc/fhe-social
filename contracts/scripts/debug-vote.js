const hre = require("hardhat");

async function main() {
  console.log("=== Debugging Vote Function ===\n");

  const [user] = await hre.ethers.getSigners();
  console.log("User address:", user.address);

  // Contract addresses
  const votingAddress = "0x87b2eEE655D41b07d4dF8124F0B601636F45808e";
  const votingManagerAddress = "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28";

  // Get contracts
  const FHESocial = await hre.ethers.getContractFactory("FHESocialVoting");
  const fheSocial = FHESocial.attach(votingAddress);

  const VotingManager = await hre.ethers.getContractFactory("VotingManager");
  const votingManager = VotingManager.attach(votingManagerAddress);

  // Test with channel ID 0
  const channelId = 0;

  console.log("1. Checking if user is registered...");
  try {
    const userProfile = await fheSocial.getUserProfile(user.address);
    console.log("User profile:", {
      username: userProfile[0],
      exists: userProfile[4]
    });

    if (!userProfile[4]) {
      console.log("❌ User not registered!");
      return;
    }
  } catch (e) {
    console.error("Error checking user:", e.message);
    return;
  }

  console.log("\n2. Checking if channel exists...");
  try {
    const channel = await fheSocial.getChannel(channelId);
    console.log("Channel:", {
      name: channel[0],
      exists: channel[5]
    });

    if (!channel[5]) {
      console.log("❌ Channel not found!");
      return;
    }
  } catch (e) {
    console.error("Error checking channel:", e.message);
    return;
  }

  console.log("\n3. Checking vote info...");
  try {
    const voteInfo = await votingManager.getVoteInfo(channelId);
    console.log("Vote info:", {
      question: voteInfo[0],
      options: voteInfo[1],
      isMultiChoice: voteInfo[2],
      active: voteInfo[3],
      createdAt: voteInfo[4].toString()
    });

    if (!voteInfo[3]) {
      console.log("❌ Vote not active!");
      return;
    }
  } catch (e) {
    console.error("Error checking vote:", e.message);
    return;
  }

  console.log("\n4. Checking if user has already voted...");
  try {
    const hasVoted = await votingManager.hasVoted(channelId, user.address);
    console.log("Has voted:", hasVoted);

    if (hasVoted) {
      console.log("❌ User already voted!");
      return;
    }
  } catch (e) {
    console.error("Error checking hasVoted:", e.message);
    return;
  }

  console.log("\n5. Checking authorization...");
  try {
    const isAuthorized = await votingManager.authorized(votingAddress);
    console.log("FHESocialVoting authorized in VotingManager:", isAuthorized);

    if (!isAuthorized) {
      console.log("❌ FHESocialVoting not authorized in VotingManager!");
      return;
    }
  } catch (e) {
    console.error("Error checking authorization:", e.message);
    return;
  }

  console.log("\n=== All Checks Passed ===");
  console.log("The voting function should work correctly.");
  console.log("\nPossible issues:");
  console.log("1. FHE encryption/proof format might be incorrect");
  console.log("2. Gas limit might be too low");
  console.log("3. FHE relayer might be down or slow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
