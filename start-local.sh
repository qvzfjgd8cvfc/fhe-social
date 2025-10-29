#!/bin/bash

# FHE Social - Local Development Quick Start
# This script starts local Hardhat node and deploys contracts

echo "🚀 FHE Social - Local Development Setup"
echo "========================================"
echo ""

# Check if in correct directory
if [ ! -d "contracts" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the fhe-social root directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
cd contracts
if [ ! -d "node_modules" ]; then
    echo "Installing contract dependencies..."
    yarn install
fi
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    yarn install
fi
cd ..

echo ""
echo "🔧 Step 2: Starting Hardhat local node..."
echo "This will run in the background. To stop it later, run: pkill -f 'hardhat node'"
cd contracts
npx hardhat node > ../hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo "Hardhat node started (PID: $HARDHAT_PID)"
sleep 3

echo ""
echo "📝 Step 3: Deploying contracts..."
npx hardhat run scripts/deploy-local.js --network localhost

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    kill $HARDHAT_PID
    exit 1
fi

cd ..

echo ""
echo "⚙️  Step 4: Updating frontend configuration..."
cd frontend
node scripts/update-local-env.js

if [ $? -ne 0 ]; then
    echo "❌ Configuration update failed!"
    kill $HARDHAT_PID
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add Hardhat Local network to MetaMask:"
echo "   - Network Name: Hardhat Local"
echo "   - RPC URL: http://127.0.0.1:8545"
echo "   - Chain ID: 31337"
echo "   - Currency: ETH"
echo ""
echo "2. Import a test account (copy private key from hardhat-node.log)"
echo ""
echo "3. Start frontend:"
echo "   cd frontend && yarn dev"
echo ""
echo "📄 Logs: hardhat-node.log"
echo "🛑 Stop Hardhat: kill $HARDHAT_PID"
echo ""
