# FHE Social - Privacy-Preserving Social Platform

A decentralized social platform built with Zama's FHE (Fully Homomorphic Encryption) technology, enabling encrypted user addresses while maintaining public message content.

## 🏗️ Architecture

### Smart Contracts (Modular Design)

1. **UserRegistry** - Manages user profiles with encrypted addresses
   - User registration with encrypted address storage
   - Username management (plaintext)
   - User statistics tracking

2. **ChannelManager** - Manages chat channels
   - Channel creation with encrypted creator addresses
   - Channel metadata (name, description - plaintext)
   - Message count tracking

3. **MessageManager** - Manages messages and replies
   - Message posting with encrypted author addresses
   - Reply system
   - Content storage (plaintext)

4. **FHESocialV2** - Main orchestrator contract
   - Coordinates all module interactions
   - Simplified API for frontend integration
   - Authorization management

### Frontend Stack

- **React 18** with TypeScript
- **Vite** build tool
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **Wagmi v2** + **Viem** for Web3 interactions
- **RainbowKit** for wallet connection
- **fhevmjs** for FHE encryption

## 🔒 Privacy Features

### Encrypted (FHE):
- ✅ Channel creator addresses
- ✅ Message author addresses
- ✅ Reply author addresses
- ✅ User addresses in profiles

### Plaintext:
- Channel names
- Channel descriptions
- Message content
- Reply content
- Usernames

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Sepolia ETH for deployment
- MetaMask or compatible wallet

### 1. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### 3. Deploy to Sepolia

```bash
# Set up environment variables
cp .env.example .env
# Edit .env and add your DEPLOYER_PRIVATE_KEY

# Deploy contracts
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" npx hardhat run scripts/deploy.js --network sepolia
```

The deployment script will:
- Deploy all 4 contracts
- Set up authorization
- Save deployment addresses to `deployments/sepolia.json`
- Update frontend `.env` automatically

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Visit http://localhost:8080

## 📝 Contract Functions

### User Management

```solidity
// Register a new user
registerUser(string username)

// Update username
updateUsername(string newUsername)

// Get user profile
getUserProfile(address user) returns (username, registeredAt, messageCount, channelCount, exists)
```

### Channel Management

```solidity
// Create a new channel
createChannel(string name, string description) returns (uint256 channelId)

// Get channel details
getChannel(uint256 channelId) returns (name, description, createdAt, messageCount, exists)

// Get all messages in a channel
getChannelMessages(uint256 channelId) returns (uint256[] memory)
```

### Message Management

```solidity
// Post a message to a channel
postMessage(uint256 channelId, string content) returns (uint256 messageId)

// Reply to a message
postReply(uint256 messageId, string content) returns (uint256 replyId)

// Get message details
getMessage(uint256 messageId) returns (content, timestamp, channelId, replyCount, exists)

// Get reply details
getReply(uint256 messageId, uint256 replyId) returns (content, timestamp, exists)
```

### Statistics

```solidity
// Get platform statistics
getStats() returns (totalUsers, totalChannels, totalMessages)
```

## 🛠️ Development

### Contract Structure

```
contracts/
├── src/
│   ├── FHESocialV2.sol          # Main orchestrator
│   ├── modules/
│   │   ├── UserRegistry.sol      # User management
│   │   ├── ChannelManager.sol    # Channel management
│   │   └── MessageManager.sol    # Message/reply management
│   └── interfaces/
│       ├── IUserRegistry.sol
│       ├── IChannelManager.sol
│       └── IMessageManager.sol
├── scripts/
│   └── deploy.js                 # Automated deployment
├── hardhat.config.js
└── DEPLOYMENT.md                 # Detailed deployment guide
```

### Frontend Structure

```
frontend/
├── src/
│   ├── contracts/
│   │   ├── FHESocialV2ABI.json   # Contract ABI
│   │   └── constants.ts          # Contract addresses
│   ├── hooks/
│   │   └── useFHESocial.ts       # Main contract hook
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── Discussion.tsx
│   └── components/
│       └── ui/                    # shadcn components
├── vite.config.ts
└── package.json
```

## 🧪 Testing

### Run Contract Tests

```bash
cd contracts
npx hardhat test
```

### Frontend Development

```bash
cd frontend
npm run dev
```

## 📦 Build

### Build Contracts

```bash
cd contracts
npx hardhat compile
```

### Build Frontend

```bash
cd frontend
npm run build
```

## 🔑 Key Features

1. **Privacy-First Design**
   - User addresses encrypted with FHE
   - Creator/author addresses never exposed
   - Maintain privacy while enabling public discussion

2. **Modular Architecture**
   - Separated concerns for better maintainability
   - Independent contract upgradability
   - Clear authorization patterns

3. **Modern Frontend**
   - Type-safe React hooks
   - Real-time message updates
   - Responsive design with Tailwind CSS

4. **Simplified API**
   - Direct address encryption in contracts
   - No need for external encryption parameters
   - Easy frontend integration

## 🔧 Configuration

### Contract Environment Variables

```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your_etherscan_api_key_here  # Optional
```

### Frontend Environment Variables

```env
VITE_CONTRACT_ADDRESS=0x...
VITE_USER_REGISTRY_ADDRESS=0x...
VITE_CHANNEL_MANAGER_ADDRESS=0x...
VITE_MESSAGE_MANAGER_ADDRESS=0x...
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## 🐛 Troubleshooting

### Common Issues

1. **Compilation Error: euint160 not supported**
   - FHE library only supports up to euint64
   - We use euint64 to store 64-bit address hashes

2. **lovable-tagger import error**
   - Removed from package.json and vite.config.ts
   - Clean install: `rm -rf node_modules package-lock.json && npm install`

3. **Deployment fails: insufficient funds**
   - Get Sepolia ETH from https://sepoliafaucet.com/

4. **Contract not authorized error**
   - Deployment script automatically sets authorization
   - Verify with: `await userRegistry.authorized(fheSocialAddress)`

## 📚 Documentation

- [Detailed Deployment Guide](contracts/DEPLOYMENT.md)
- [Zama fhEVM Docs](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/)

## 🔐 Security Notes

1. **Never commit private keys**
2. **.env files are gitignored**
3. **Use dedicated wallets for deployment**
4. **Test thoroughly on Sepolia before mainnet**
5. **Verify all contract addresses after deployment**

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🌟 Features Roadmap

- [ ] Direct messaging
- [ ] File attachments (encrypted)
- [ ] User reputation system
- [ ] Channel moderation tools
- [ ] Mobile app
- [ ] IPFS integration

## 📞 Support

- GitHub Issues: [Report bugs or request features]
- Documentation: See contracts/DEPLOYMENT.md for detailed guides
- Zama Discord: https://discord.com/invite/fhe

