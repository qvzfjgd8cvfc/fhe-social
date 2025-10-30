const hre = require("hardhat");

async function main() {
  console.log("=== Testing Vote Function Directly ===\n");

  const [user] = await hre.ethers.getSigners();
  console.log("Test user:", user.address);

  const votingManagerAddress = "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28";
  const VotingManager = await hre.ethers.getContractFactory("VotingManager");
  const votingManager = VotingManager.attach(votingManagerAddress);

  const channelId = 0;

  console.log("\n1. Checking vote info...");
  try {
    const voteInfo = await votingManager.getVoteInfo(channelId);
    console.log("Vote question:", voteInfo[0]);
    console.log("Vote options:", voteInfo[1]);
    console.log("Is active:", voteInfo[3]);
  } catch (e) {
    console.error("Error:", e.message);
    return;
  }

  console.log("\n2. Testing castVote with mock encrypted data...");

  // Create mock encrypted data (this won't work with real FHE but will show the error)
  const mockHandle = "0x" + "00".repeat(32);
  const mockProof = "0x" + "00".repeat(100);

  console.log("Mock handle:", mockHandle);
  console.log("Mock proof:", mockProof);

  try {
    // Try to estimate gas first to see the revert reason
    console.log("\nEstimating gas...");
    const gasEstimate = await votingManager.castVote.estimateGas(
      channelId,
      mockHandle,
      mockProof
    );
    console.log("Gas estimate:", gasEstimate.toString());
  } catch (e) {
    console.error("\n❌ Gas estimation failed:");
    console.error("Error message:", e.message);
    console.error("\nFull error:", e);

    // Try to extract revert reason
    if (e.data) {
      console.error("Error data:", e.data);
    }
    if (e.reason) {
      console.error("Revert reason:", e.reason);
    }
  }

  console.log("\n3. Checking VotingManager contract bytecode...");
  const code = await hre.ethers.provider.getCode(votingManagerAddress);
  console.log("Contract has code:", code.length > 2);
  console.log("Code length:", code.length);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
