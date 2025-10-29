const fs = require('fs');
const path = require('path');

/**
 * Automatically update frontend .env.local from contract deployment
 */
function main() {
  const deploymentPath = path.join(__dirname, '../../contracts/deployments/localhost.json');
  const envPath = path.join(__dirname, '../.env.local');

  // Check if deployment exists
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ Deployment file not found!');
    console.log('Please run: cd contracts && npx hardhat run scripts/deploy-local.js --network localhost');
    process.exit(1);
  }

  // Read deployment info
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

  // Create .env.local content
  const envContent = `# Local Development Configuration
# Auto-generated from contracts/deployments/localhost.json
# Generated: ${new Date().toISOString()}

VITE_CONTRACT_ADDRESS=${deployment.FHESocialVoting}
VITE_USER_REGISTRY_ADDRESS=${deployment.UserRegistry}
VITE_CHANNEL_MANAGER_ADDRESS=${deployment.ChannelManagerSimple}
VITE_MESSAGE_MANAGER_ADDRESS=${deployment.MessageManagerSimple}
VITE_VOTING_MANAGER_ADDRESS=${deployment.VotingManager}

# Local Network Configuration
VITE_SEPOLIA_CHAIN_ID=31337
VITE_SEPOLIA_RPC_URL=http://127.0.0.1:8545

# Disable FHE for local testing
VITE_USE_FHE=false
`;

  // Write .env.local
  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env.local updated successfully!');
  console.log('\n📋 Configuration:');
  console.log('FHESocialVoting:', deployment.FHESocialVoting);
  console.log('VotingManager:', deployment.VotingManager);
  console.log('Chain ID:', 31337);
  console.log('RPC URL:', 'http://127.0.0.1:8545');
  console.log('\n🚀 Start frontend: yarn dev');
}

main();
