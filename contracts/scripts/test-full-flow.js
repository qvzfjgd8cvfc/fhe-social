const hre = require("hardhat");

async function main() {
    const contractAddress = "0x2ba8a0DFfbB257b2b22ad68A51bCF492DBD0AD91";
    
    console.log("=== Testing Full Flow ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with deployer:", deployer.address);
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);
    
    // 1. Register
    console.log("\n1. Registering...");
    const regTx = await FHESocial.register("TestUser");
    await regTx.wait();
    console.log("✓ Registered");
    
    // 2. Create channel only
    console.log("\n2. Creating channel only...");
    const chTx = await FHESocial.createChannel("Test Channel", "Test Desc");
    const chReceipt = await chTx.wait();
    console.log("✓ Channel created! Gas used:", chReceipt.gasUsed.toString());
    
    // 3. Create channel with vote
    console.log("\n3. Creating channel with vote...");
    const testName = "Test Vote Channel";
    const testDesc = "Channel with voting";
    const testQuestion = "Test Question?";
    const testOptions = ["Option 1", "Option 2"];
    const testDuration = 7 * 24 * 60 * 60; // 7 days
    
    const vTx = await FHESocial.createChannelWithVote(
        testName,
        testDesc,
        testQuestion,
        testOptions,
        testDuration
    );
    const vReceipt = await vTx.wait();
    console.log("✓ Channel with vote created! Gas used:", vReceipt.gasUsed.toString());
    
    console.log("\n=== All Tests Passed! ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
