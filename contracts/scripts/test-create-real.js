const hre = require("hardhat");

async function main() {
    const contractAddress = "0xE7C92184128D9aE5dC44Da40976C5CEd220d4670";
    
    console.log("=== Testing createChannelWithVote ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with deployer:", deployer.address);
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);
    
    // Check deployer registration
    const deployerInfo = await FHESocial.getUser(deployer.address);
    console.log("\nDeployer Info:");
    console.log("  Username:", deployerInfo[0]);
    console.log("  Registered:", deployerInfo[1]);
    
    if (!deployerInfo[1]) {
        console.log("\nRegistering deployer first...");
        const regTx = await FHESocial.register("TestDeployer");
        await regTx.wait();
        console.log("✓ Deployer registered");
    }
    
    // Try creating a channel with vote
    console.log("\nAttempting to create channel with vote...");
    try {
        const testName = "Test Channel";
        const testDesc = "Test Description";
        const testQuestion = "Test Question?";
        const testOptions = ["Option 1", "Option 2"];
        const testDuration = 7 * 24 * 60 * 60; // 7 days in seconds
        
        console.log("Parameters:");
        console.log("  Duration (seconds):", testDuration);
        console.log("  Duration check: >= 3600 (1 hour)?", testDuration >= 3600);
        console.log("  Duration check: <= 7776000 (90 days)?", testDuration <= 7776000);
        
        const tx = await FHESocial.createChannelWithVote(
            testName,
            testDesc,
            testQuestion,
            testOptions,
            testDuration
        );
        
        console.log("\nTransaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✓ Transaction confirmed!");
        console.log("  Gas used:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.error("\n✗ Transaction failed!");
        console.error("Error message:", error.message);
        
        if (error.data) {
            console.error("Error data:", error.data);
        }
        
        // Try to decode the error
        if (error.message.includes("revert")) {
            const match = error.message.match(/revert (.+?)"/);
            if (match) {
                console.error("Revert reason:", match[1]);
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
