const hre = require("hardhat");

async function main() {
  const votingManager = await hre.ethers.getContractAt(
    "VotingManager",
    "0x51f6F4F60ba643aEbBDcdd19c0f92614A1242A28"
  );

  const fheSocialAddress = "0x87b2eEE655D41b07d4dF8124F0B601636F45808e";

  console.log("Checking VotingManager authorization...\n");
  console.log("FHESocialVoting address:", fheSocialAddress);

  const isAuthorized = await votingManager.authorized(fheSocialAddress);
  console.log("Is authorized:", isAuthorized);

  const owner = await votingManager.owner();
  console.log("VotingManager owner:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
