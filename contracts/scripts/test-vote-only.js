const hre = require("hardhat");

async function main() {
    const contractAddress = "0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7";
    
    console.log("=== Testing Vote Functionality ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with:", deployer.address);
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);

    // Check and register if needed
    const userInfo = await FHESocial.getUser(deployer.address);
    if (!userInfo[1]) {
        console.log("\n0. Registering user...");
        const regTx = await FHESocial.register("TestDeployer");
        await regTx.wait();
        console.log("✓ Registered");
    } else {
        console.log("\n0. Already registered as:", userInfo[0]);
    }

    // Create channel with vote
    console.log("\n1. Creating channel with vote...");
    const testName = "Vote Test Channel";
    const testDesc = "Testing optimized voting";
    const testQuestion = "Which option do you prefer?";
    const testOptions = ["Option A", "Option B", "Option C"];
    const testDuration = 7 * 24 * 60 * 60; // 7 days
    
    const tx = await FHESocial.createChannelWithVote(
        testName,
        testDesc,
        testQuestion,
        testOptions,
        testDuration
    );
    const receipt = await tx.wait();
    console.log("✓ Channel created! Gas used:", receipt.gasUsed.toString());
    
    // Get channel count
    const channelCount = await FHESocial.channelCount();
    const newChannelId = channelCount - 1n;
    console.log("New channel ID:", newChannelId.toString());
    
    // Get vote info
    console.log("\n2. Getting vote info...");
    const voteInfo = await FHESocial.getVoteInfo(newChannelId);
    console.log("Question:", voteInfo[0]);
    console.log("Options:", voteInfo[1]);
    console.log("Active:", voteInfo[4]);
    
    console.log("\n=== Test Complete! ===");
    console.log("Channel ID:", newChannelId.toString());
    console.log("You can now test voting from the frontend!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
