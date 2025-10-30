const hre = require("hardhat");

async function main() {
    const contractAddress = "0xE7C92184128D9aE5dC44Da40976C5CEd220d4670";
    const userAddress = "0xdc82296843f8a3a630d3F9d960297abfC207d173";
    
    console.log("=== Debugging Create Channel Transaction ===");
    console.log("Contract:", contractAddress);
    console.log("User:", userAddress);
    console.log("");
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);
    
    // Check user registration
    const userInfo = await FHESocial.getUser(userAddress);
    console.log("User Registration:");
    console.log("  Username:", userInfo[0]);
    console.log("  Registered:", userInfo[1]);
    console.log("  RegisteredAt:", userInfo[2].toString());
    console.log("");
    
    // Check channel count
    const channelCount = await FHESocial.channelCount();
    console.log("Current Channel Count:", channelCount.toString());
    console.log("");
    
    // Try to simulate the transaction
    console.log("Simulating createChannelWithVote...");
    try {
        const testName = "Test Channel";
        const testDesc = "Test Description";
        const testQuestion = "Test Question?";
        const testOptions = ["Option 1", "Option 2"];
        const testDuration = 7 * 24 * 60 * 60; // 7 days in seconds
        
        console.log("Parameters:");
        console.log("  Name:", testName);
        console.log("  Description:", testDesc);
        console.log("  Question:", testQuestion);
        console.log("  Options:", testOptions);
        console.log("  Duration (seconds):", testDuration);
        console.log("");
        
        // Use callStatic to simulate without actually sending
        await FHESocial.createChannelWithVote.staticCall(
            testName,
            testDesc,
            testQuestion,
            testOptions,
            testDuration,
            { from: userAddress }
        );
        
        console.log("✓ Simulation successful!");
    } catch (error) {
        console.error("✗ Simulation failed!");
        console.error("Error:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
