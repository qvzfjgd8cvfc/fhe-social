const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load contract address from deployment file
  const deploymentPath = path.join(__dirname, "..", `deployment-${hre.network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error("Deployment file not found. Run deploy first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const CONTRACT_ADDRESS = deployment.FHESocial;
  console.log("Contract address:", CONTRACT_ADDRESS);

  const FHESocial = await hre.ethers.getContractAt("FHESocial", CONTRACT_ADDRESS);

  // Check if already registered
  const user = await FHESocial.getUser(deployer.address);
  if (!user[1]) {
    console.log("\n1. Registering user...");
    const regTx = await FHESocial.register("VoxAdmin");
    await regTx.wait();
    console.log("Registered as VoxAdmin");
  } else {
    console.log("\n1. Already registered as:", user[0]);
  }

  await new Promise(r => setTimeout(r, 3000));

  // Create channels with voting
  const channels = [
    {
      name: "Web3 Privacy Discussion",
      description: "Discuss privacy-preserving technologies in Web3",
      voteQuestion: "What is the most important privacy feature?",
      voteOptions: ["Zero-Knowledge Proofs", "Fully Homomorphic Encryption", "Multi-Party Computation", "Secure Enclaves"],
      duration: 7 * 24 * 60 * 60
    },
    {
      name: "FHE Development",
      description: "Technical discussions about FHE implementation",
      voteQuestion: "Which FHE library should we focus on?",
      voteOptions: ["Zama TFHE-rs", "Microsoft SEAL", "OpenFHE", "Concrete"],
      duration: 14 * 24 * 60 * 60
    },
    {
      name: "DeFi Innovation",
      description: "Exploring encrypted DeFi possibilities",
      voteQuestion: "What DeFi use case needs privacy most?",
      voteOptions: ["Private Lending", "Dark Pools", "Private Auctions", "Confidential Staking"],
      duration: 7 * 24 * 60 * 60
    }
  ];

  const currentCount = await FHESocial.channelCount();
  console.log("\nCurrent channel count:", currentCount.toString());

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    console.log(`\n${i + 2}. Creating channel: "${ch.name}"...`);

    try {
      const tx = await FHESocial.createChannelWithVote(
        ch.name,
        ch.description,
        ch.voteQuestion,
        ch.voteOptions,
        BigInt(ch.duration),
        { gasLimit: 1000000 }
      );
      const receipt = await tx.wait();
      console.log(`   Created! TX: ${receipt.hash}`);
      await new Promise(r => setTimeout(r, 5000));
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Verify
  const newCount = await FHESocial.channelCount();
  console.log("\n=== Summary ===");
  console.log("Total channels:", newCount.toString());

  for (let i = 0; i < Number(newCount); i++) {
    const channel = await FHESocial.getChannel(BigInt(i));
    const voteInfo = await FHESocial.getVoteInfo(BigInt(i));
    console.log(`\nChannel ${i}: ${channel[0]}`);
    console.log(`  Description: ${channel[1]}`);
    console.log(`  Vote: ${voteInfo[0]}`);
    console.log(`  Options: ${voteInfo[1].join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
