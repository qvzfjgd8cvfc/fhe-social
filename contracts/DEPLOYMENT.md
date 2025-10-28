# FHE Social - Deployment Guide

This guide explains how to deploy the FHE Social smart contracts to Sepolia testnet.

## Architecture Overview

The FHE Social platform consists of 4 modular contracts:

1. **UserRegistry** - Manages user profiles with encrypted addresses
2. **ChannelManager** - Manages chat channels with encrypted creator addresses
3. **MessageManager** - Manages messages and replies with encrypted author addresses
4. **FHESocialV2** - Main orchestrator contract that coordinates all modules

## Prerequisites

1. **Node.js and npm** installed
2. **Sepolia ETH** for deployment (get from https://sepoliafaucet.com/)
3. **Private Key** with Sepolia ETH
4. **RPC URL** (default: https://ethereum-sepolia-rpc.publicnode.com)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your private key
nano .env
```

Add your configuration to `.env`:

```env
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your_etherscan_api_key_here  # Optional
```

⚠️ **IMPORTANT**: Never commit your `.env` file to version control!

### 3. Compile Contracts

```bash
npx hardhat compile
```

You should see:
```
Compiled 16 Solidity files successfully (evm target: cancun).
```

### 4. Deploy to Sepolia

```bash
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" npx hardhat run scripts/deploy.js --network sepolia
```

The deployment script will:
1. Deploy UserRegistry
2. Deploy ChannelManager
3. Deploy MessageManager
4. Deploy FHESocialV2
5. Set up authorization (FHESocialV2 can call all modules)
6. Save deployment info to `deployments/sepolia.json`
7. Update frontend `.env` file automatically

### 5. Verify Deployment

After deployment, you'll see a summary like:

```
═══════════════════════════════════════════════════════════
📋 DEPLOYMENT SUMMARY
═══════════════════════════════════════════════════════════
Network: sepolia
Deployer: 0x...

📝 Contract Addresses:
  FHESocialV2:       0x...
  UserRegistry:      0x...
  ChannelManager:    0x...
  MessageManager:    0x...

✅ All contracts deployed and authorized successfully!
═══════════════════════════════════════════════════════════
```

## Contract Interactions

### Main Contract Functions (FHESocialV2)

#### User Management
- `registerUser(string username)` - Register a new user
- `updateUsername(string newUsername)` - Update your username
- `getUserProfile(address user)` - Get user profile info

#### Channel Management
- `createChannel(string name, string description)` - Create a new channel
- `getChannel(uint256 channelId)` - Get channel details
- `getChannelMessages(uint256 channelId)` - Get all message IDs in a channel

#### Message Management
- `postMessage(uint256 channelId, string content)` - Post a message to a channel
- `postReply(uint256 messageId, string content)` - Reply to a message
- `getMessage(uint256 messageId)` - Get message details

#### Statistics
- `getStats()` - Get platform statistics (total users, channels, messages)

## Privacy Features

### What is Encrypted (FHE):
- ✅ Channel creator addresses
- ✅ Message author addresses
- ✅ Reply author addresses
- ✅ User addresses in profiles

### What is Plaintext:
- Channel names
- Channel descriptions
- Message content
- Reply content
- Usernames

## Troubleshooting

### Compilation Errors

**Error**: `Cannot find module '@fhevm/solidity'`
```bash
npm install @fhevm/solidity @zama-fhe/oracle-solidity
```

### Deployment Errors

**Error**: `insufficient funds for intrinsic transaction cost`
- Get Sepolia ETH from https://sepoliafaucet.com/

**Error**: `nonce too low`
- Wait a few seconds and retry, or reset your account in MetaMask

**Error**: `replacement transaction underpriced`
- Increase gas price or wait for previous transaction to complete

### Network Issues

If public RPC is slow or failing, get a free private RPC from:
- Alchemy: https://www.alchemy.com/
- Infura: https://infura.io/
- QuickNode: https://www.quicknode.com/

Update your `.env` file:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## Verify Contracts on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

For contracts with constructor arguments:
```bash
npx hardhat verify --network sepolia FHESOCIAL_V2_ADDRESS "CHANNEL_MANAGER_ADDRESS" "MESSAGE_MANAGER_ADDRESS" "USER_REGISTRY_ADDRESS"
```

## Security Notes

1. **Never share your private key**
2. **Never commit `.env` file**
3. **Use a dedicated wallet for deployment**
4. **Verify contract addresses before use**
5. **Test on Sepolia before mainnet**

## Support

- Zama fhEVM Docs: https://docs.zama.ai/fhevm
- Hardhat Docs: https://hardhat.org/
- Sepolia Faucet: https://sepoliafaucet.com/

## Next Steps

After deployment:
1. Note down all contract addresses
2. Update frontend `.env` file (done automatically by deploy script)
3. Test all functions on Sepolia
4. Verify contracts on Etherscan
5. Monitor gas usage and optimize if needed
