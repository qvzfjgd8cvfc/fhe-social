const hre = require("hardhat");

async function main() {
    const contractAddress = "0xE7C92184128D9aE5dC44Da40976C5CEd220d4670";
    const userAddress = "0xdc82296843f8a3a630d3F9d960297abfC207d173";
    
    console.log("=== Checking User Registration ===");
    console.log("Contract:", contractAddress);
    console.log("User:", userAddress);
    console.log("");
    
    const FHESocial = await hre.ethers.getContractAt("FHESocial", contractAddress);
    
    const userInfo = await FHESocial.getUser(userAddress);
    console.log("Username:", userInfo[0]);
    console.log("Registered:", userInfo[1]);
    console.log("RegisteredAt:", userInfo[2].toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
