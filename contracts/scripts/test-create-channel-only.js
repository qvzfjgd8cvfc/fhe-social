const hre = require("hardhat");

async function main() {
    const contractAddress = "0x2ba8a0DFfbB257b2b22ad68A51bCF492DBD0AD91";
    
    console.log("=== Testing createChannel (without vote) ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with deployer:", deployer.address);
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);
    
    // Try creating a channel without vote
    console.log("\nAttempting to create channel only...");
    try {
        const testName = "Test Channel";
        const testDesc = "Test Description";
        
        const tx = await FHESocial.createChannel(testName, testDesc);
        
        console.log("\nTransaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✓ Transaction confirmed!");
        console.log("  Gas used:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.error("\n✗ Transaction failed!");
        console.error("Error message:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
