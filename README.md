<div align="center">
  <img src="frontend/public/favicon.svg" alt="VoxCircle Logo" width="128" height="128">

  # VoxCircle - Privacy-Preserving Social Platform

  A decentralized social platform built with Zama's FHE (Fully Homomorphic Encryption) technology, enabling **encrypted voting** while maintaining transparent discussions. Users can create channels, post messages, and participate in privacy-preserving polls where votes remain confidential throughout the entire process.
</div>

<div align="center">

**Live Demo**: https://voxcircle.vercel.app
**Contract Address**: `0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7` (Sepolia)
**GitHub**: https://github.com/qvzfjgd8cvfc/fhe-social

</div>

---

## 🎯 Project Overview

VoxCircle is a blockchain-based social platform that combines transparency with privacy:

- **Transparent Communication**: All messages and channel activities are public and stored on-chain
- **Private Voting**: Voting choices are fully encrypted using FHE, ensuring no one (including administrators) can see individual votes
- **User Registration**: Simple username-based registration system
- **Channel System**: Create topic-based discussion channels with integrated voting polls

### Key Innovation: FHE Voting

Unlike traditional voting systems that rely on off-chain aggregation or trusted parties, VoxCircle uses **Fully Homomorphic Encryption (FHE)** to keep votes encrypted on-chain. This means:

1. ✅ Votes are encrypted client-side before submission
2. ✅ Smart contracts store encrypted votes directly (no decryption)
3. ✅ No trusted third party needed
4. ✅ Vote privacy is cryptographically guaranteed
5. ✅ Gas-optimized design (no loops, no aggregation during voting)

---

## 🔐 FHE Voting Mechanism Explained

### Traditional Voting Problems

Traditional blockchain voting systems face critical challenges:

- **Privacy**: Votes are typically visible on-chain
- **Trusted Setup**: Require off-chain tallying or trusted aggregators
- **Gas Costs**: Complex cryptographic operations are expensive
- **Attack Vectors**: Vote buying, coercion, and result manipulation

### VoxCircle's FHE Solution

VoxCircle leverages **Zama's fhEVM** to enable on-chain encrypted voting. Here's how it works:

#### 1. Vote Creation

```solidity
struct Vote {
    string question;
    string[] options;              // 2-10 voting options
    uint256 startTime;
    uint256 endTime;
    bool active;
    mapping(address => euint8) userVotes;  // ⚡ Encrypted votes
    mapping(address => bool) hasVoted;
}
```

When a channel creator starts a vote, they define:
- Question (e.g., "Which feature should we build next?")
- Options (e.g., ["Mobile App", "Desktop App", "API"])
- Duration (1 hour to 90 days)

**No FHE initialization** happens at creation time (gas optimization).

#### 2. Vote Casting (Client-Side Encryption)

The frontend uses Zama's SDK to encrypt the vote choice:

```typescript
// 1. User selects option index (0, 1, 2, etc.)
const optionIndex = 2; // e.g., choosing "API"

// 2. Encrypt using FHE instance
const instance = await createFhevmInstance();
const { handles, inputProof } = await instance.createEncryptedInput(
  contractAddress,
  userAddress
);
handles.add8(optionIndex);  // Encrypt as euint8
const encryptedData = handles.encrypt();

// 3. Submit encrypted vote to contract
await contract.castVote(
  channelId,
  encryptedData.handles[0],  // encrypted option index
  encryptedData.inputProof   // zero-knowledge proof
);
```

**Key Points**:
- The option index (0-9) is encrypted into `euint8` type
- Encryption happens in the browser using Zama's cryptographic library
- A zero-knowledge proof ensures the encrypted value is valid
- No plaintext vote data ever touches the blockchain

#### 3. Vote Storage (Smart Contract)

```solidity
function castVote(
    uint256 _channelId,
    externalEuint8 _encryptedOption,  // Encrypted input
    bytes calldata _inputProof         // ZK proof
) external onlyRegistered {
    require(_channelId < channelCount, "Invalid channel");

    Vote storage v = channelVotes[_channelId];
    require(v.active, "Vote not active");
    require(block.timestamp < v.endTime, "Vote ended");
    require(!v.hasVoted[msg.sender], "Already voted");

    // ⚡ Store encrypted vote directly - NO LOOPS!
    euint8 encryptedOptionIndex = FHE.fromExternal(_encryptedOption, _inputProof);
    v.userVotes[msg.sender] = encryptedOptionIndex;

    // Allow contract to use this encrypted value (ACL)
    FHE.allowThis(v.userVotes[msg.sender]);

    v.hasVoted[msg.sender] = true;

    emit VoteCast(_channelId, msg.sender);
}
```

**Critical Gas Optimization**:
- ❌ **OLD APPROACH** (400k+ gas): Loop through all options, use `FHE.select()` to increment each counter
- ✅ **NEW APPROACH** (100-150k gas): Directly store user's encrypted choice, no loops, no aggregation

#### 4. Vote Counting (Future Implementation)

While vote counting isn't implemented in the current version, here's how it would work:

```solidity
// After vote ends, anyone can trigger decryption
function tallyVotes(uint256 _channelId) external {
    require(!channelVotes[_channelId].active, "Vote still active");

    // For each option, count matching votes
    for (uint8 i = 0; i < options.length; i++) {
        uint256 count = 0;

        // Iterate through all voters
        for (address voter in voters) {
            euint8 userVote = v.userVotes[voter];

            // FHE comparison: does userVote == i?
            ebool matches = FHE.eq(userVote, FHE.asEuint8(i));

            // FHE conditional: if matches, count += 1
            count = FHE.decrypt(FHE.add(
                FHE.asEuint8(count),
                FHE.select(matches, FHE.asEuint8(1), FHE.asEuint8(0))
            ));
        }

        optionCounts[i] = count;
    }
}
```

**Note**: This tallying process would require gateway decryption in production. The current implementation focuses on demonstrating vote privacy during the active voting period.

### Gas Cost Comparison

| Operation | Old Method (Loops) | New Method (Direct Storage) |
|-----------|-------------------|---------------------------|
| Vote Creation | ~150k gas | ~100k gas |
| Cast Vote (2 options) | ~350k gas | ~120k gas |
| Cast Vote (5 options) | ~800k gas | ~120k gas |
| Cast Vote (10 options) | **FAILS** (>12M gas) | ~120k gas |

The new direct storage method maintains **constant gas cost** regardless of the number of voting options.

### Security Properties

1. **Ballot Privacy**: Individual votes remain encrypted throughout the voting period
2. **Coercion Resistance**: Voters cannot prove how they voted (no receipt)
3. **Verifiability**: Anyone can verify the encrypted vote was cast (on-chain event)
4. **Immutability**: Once cast, votes cannot be changed or deleted
5. **No Trusted Party**: Encryption happens client-side, no intermediaries

---

## 🏗️ Technical Architecture

### Smart Contract Design

**Unified Contract**: `FHESocial.sol` (Single contract handling all features)

```
FHESocial (0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7)
│
├── User Management
│   ├── register(username)
│   ├── getUser(address)
│   └── Plaintext storage
│
├── Channel Management
│   ├── createChannel(name, description)
│   ├── createChannelWithVote(...) // ⚡ Atomic operation
│   ├── getChannel(channelId)
│   └── Plaintext storage
│
├── Message System
│   ├── postMessage(channelId, content, isAnonymous)
│   ├── getMessages(channelId, offset, limit)
│   └── Plaintext storage (optional anonymity)
│
└── Voting System (FHE)
    ├── createVote(channelId, question, options, duration)
    ├── castVote(channelId, encryptedOption, proof) // ⚡ FHE encrypted
    ├── getVoteInfo(channelId)
    ├── hasVoted(channelId, user)
    ├── endVote(channelId)
    └── Encrypted storage (euint8)
```

### Key Design Decisions

#### 1. Unified vs Modular

**Choice**: Unified single contract
**Reason**: Simplified gas costs, atomic operations, and easier frontend integration

#### 2. Lazy FHE Initialization

**Choice**: No pre-allocation of encrypted counters
**Reason**: Saves 200k+ gas at vote creation, votes initialize on-demand

#### 3. Direct Vote Storage

**Choice**: Store `mapping(address => euint8)` instead of `euint8[] optionVotes`
**Reason**: Eliminates loops during vote casting, reduces gas from 400k+ to ~120k

#### 4. Solidity 0.8.24

**Choice**: Downgrade from 0.8.28 to 0.8.24
**Reason**: Zama fhEVM v0.8.0 requires Solidity ^0.8.24, viaIR optimization needed

### Frontend Stack

```
React 18 + TypeScript
├── Vite (Build tool)
├── Wagmi v2 (Web3 React hooks)
├── RainbowKit (Wallet connection)
├── Shadcn/ui (Component library)
├── Tailwind CSS (Styling)
└── Zama FHE SDK
    ├── @zama-fhe/fhevm-js (Client-side encryption)
    ├── @zama-fhe/relayer-sdk (FHE instance creation)
    └── Browser-based encryption (no server needed)
```

### Data Flow

```
User Action → Frontend → FHE Encryption → Smart Contract → Blockchain

Example: Casting a Vote
1. User selects "Option 2" in UI
2. Frontend encrypts "2" using Zama SDK → euint8
3. Transaction submitted with encrypted data + proof
4. Smart contract verifies proof
5. Smart contract stores encrypted vote
6. Event emitted (VoteCast)
7. Frontend refreshes vote status
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Sepolia ETH ([Get from faucet](https://sepoliafaucet.com/))
- MetaMask or compatible wallet

### 1. Clone Repository

```bash
git clone https://github.com/qvzfjgd8cvfc/fhe-social.git
cd fhe-social
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
yarn install
```

### 3. Contract Deployment

```bash
cd contracts

# Create .env file
cp .env.example .env

# Edit .env and add your private key:
# DEPLOYER_PRIVATE_KEY=0x...
# SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Compile contracts
npx hardhat compile

# Deploy to Sepolia
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/deploy.js --network sepolia
```

The script will output:
```
FHESocial deployed to: 0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7
```

### 4. Configure Frontend

```bash
cd frontend

# Create .env file
echo "VITE_CONTRACT_ADDRESS=0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7" > .env
```

### 5. Run Development Server

```bash
yarn dev
```

Visit http://localhost:8080

---

## 📝 Usage Guide

### 1. Register User

```typescript
// Connect wallet first (RainbowKit button)

// Register with username
await register("alice");

// Check registration
const user = await getUser(userAddress);
// Returns: { username: "alice", registered: true, registeredAt: 1234567890 }
```

### 2. Create Channel

```typescript
// Simple channel
const channelId = await createChannel(
  "Feature Requests",
  "Suggest and discuss new features"
);

// Channel with integrated vote (atomic operation)
const channelId = await createChannelWithVote(
  "Q4 Roadmap",
  "Vote for Q4 priorities",
  "Which feature should we build first?",
  ["Mobile App", "API Gateway", "Dark Mode"],
  86400  // 24 hours
);
```

### 3. Cast Encrypted Vote

```typescript
import { createFhevmInstance } from '@/lib/fhevm';

// Create FHE instance
const instance = await createFhevmInstance();

// User selects option index (0, 1, 2...)
const optionIndex = 1; // e.g., "API Gateway"

// Encrypt vote
const { handles, inputProof } = await instance.createEncryptedInput(
  contractAddress,
  userAddress
);
handles.add8(optionIndex);
const encryptedData = handles.encrypt();

// Submit to contract
await castVote(
  channelId,
  encryptedData.handles[0],
  encryptedData.inputProof
);
```

### 4. Post Messages

```typescript
// Public message
await postMessage(channelId, "Great idea! I support this.", false);

// Anonymous message
await postMessage(channelId, "I disagree with this approach.", true);

// Retrieve messages
const { senders, contents, isAnonymousFlags, timestamps } =
  await getMessages(channelId, 0, 50);
```

---

## 🛠️ Development

### Project Structure

```
fhe-social/
├── contracts/
│   ├── src/
│   │   └── FHESocial.sol              # Main unified contract
│   ├── scripts/
│   │   ├── deploy.js                  # Deployment script
│   │   ├── create-proposals.js        # Test data creation
│   │   └── check-vote-status.js       # Debugging tools
│   ├── hardhat.config.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Index.tsx              # Main page
│   │   │   ├── ChannelDetail.tsx      # Channel view
│   │   │   ├── HowItWorks.tsx         # Documentation
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx             # Navigation
│   │   │   ├── ChannelList.tsx        # Channel browsing
│   │   │   ├── VotingPanel.tsx        # Voting UI
│   │   │   └── MessageList.tsx        # Message display
│   │   ├── hooks/
│   │   │   └── useFHESocial.ts        # Contract interactions
│   │   ├── lib/
│   │   │   └── fhevm.ts               # FHE initialization
│   │   ├── config/
│   │   │   └── wagmi.ts               # Web3 config
│   │   └── contracts/
│   │       ├── FHESocial.json         # ABI
│   │       └── constants.ts           # Contract addresses
│   ├── public/
│   │   ├── favicon.svg
│   │   └── 2025-10-30.mp4             # Demo video
│   ├── vite.config.ts
│   ├── vercel.json                     # SPA routing config
│   ├── package.json
│   └── .env
│
└── README.md
```

### Key Files Explained

#### `FHESocial.sol` (Contracts)

Main smart contract with 4 core modules:
- User registration system
- Channel management
- Message/reply system
- FHE voting system

**Critical Code Sections**:

1. **Vote Structure** (Lines 40-48):
```solidity
struct Vote {
    string question;
    string[] options;
    uint256 startTime;
    uint256 endTime;
    bool active;
    mapping(address => euint8) userVotes;  // Individual encrypted votes
    mapping(address => bool) hasVoted;
}
```

2. **Vote Casting** (Lines 294-316):
```solidity
function castVote(
    uint256 _channelId,
    externalEuint8 _encryptedOption,
    bytes calldata _inputProof
) external onlyRegistered {
    // Validation
    Vote storage v = channelVotes[_channelId];
    require(v.active, "Vote not active");
    require(!v.hasVoted[msg.sender], "Already voted");

    // Store encrypted vote (NO LOOPS!)
    euint8 encryptedOptionIndex = FHE.fromExternal(_encryptedOption, _inputProof);
    v.userVotes[msg.sender] = encryptedOptionIndex;
    FHE.allowThis(v.userVotes[msg.sender]);

    v.hasVoted[msg.sender] = true;
    emit VoteCast(_channelId, msg.sender);
}
```

#### `useFHESocial.ts` (Frontend Hook)

Main React hook for contract interactions:

```typescript
export function useFHESocial() {
  const { address } = useAccount();

  // Write functions
  const { writeContractAsync, isPending, isConfirmed } = useWriteContract();

  // Wrapper functions
  const register = (username: string) => { /* ... */ };
  const createChannel = (name: string, desc: string) => { /* ... */ };
  const castVote = (channelId: bigint, encrypted: string, proof: string) => { /* ... */ };
  const postMessage = (channelId: bigint, content: string, anon: boolean) => { /* ... */ };

  return { register, createChannel, castVote, postMessage, isPending, isConfirmed };
}

// Read-only hooks
export function useChannels() { /* ... */ }
export function useVoteInfo(channelId: bigint) { /* ... */ }
export function useMessages(channelId: bigint, offset: bigint, limit: bigint) { /* ... */ }
```

#### `VotingPanel.tsx` (Voting UI)

Handles client-side encryption and vote submission:

```typescript
const handleVote = async (optionIndex: number) => {
  // 1. Create FHE instance
  const instance = await createFhevmInstance();

  // 2. Encrypt option index
  const { handles, inputProof } = await instance.createEncryptedInput(
    CONTRACT_ADDRESS,
    address
  );
  handles.add8(optionIndex);
  const encryptedData = handles.encrypt();

  // 3. Submit to contract
  await castVote(
    channelId,
    encryptedData.handles[0],
    encryptedData.inputProof
  );
};
```

### Testing Locally

```bash
# Terminal 1: Run local Hardhat node (optional)
cd contracts
npx hardhat node

# Terminal 2: Deploy to local network (optional)
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Run frontend
cd frontend
yarn dev
```

**Note**: For FHE functionality, you must use Sepolia testnet (local Hardhat doesn't support Zama's FHE operations).

### Creating Test Data

```bash
cd contracts

# Create 10 test proposals with votes
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/create-proposals.js --network sepolia
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "FHE instance creation failed"

**Problem**: Browser cannot connect to Zama's relayer service.

**Solution**:
```typescript
// Check relayer status
const relayer = await fetch('http://localhost:8087/debug');
console.log(await relayer.json());

// Fallback: Use Zama's public relayer
const instance = await createFhevmInstance({
  network: 11155111, // Sepolia
  // Uses public relayer by default
});
```

#### 2. "Transaction underpriced"

**Problem**: Gas price too low for Sepolia network.

**Solution**: Increase gas price in wagmi config:
```typescript
// frontend/src/config/wagmi.ts
export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com', {
      maxFeePerGas: parseGwei('50'), // Increase if needed
    }),
  },
});
```

#### 3. "Vote already active"

**Problem**: Trying to create a new vote when one exists.

**Solution**: End the current vote first:
```typescript
await endVote(channelId);
// Wait for confirmation, then create new vote
```

#### 4. "Invalid input proof"

**Problem**: FHE encryption proof doesn't match encrypted data.

**Solution**: Ensure correct contract address and user address:
```typescript
const { handles, inputProof } = await instance.createEncryptedInput(
  contractAddress, // Must match deployed contract
  userAddress      // Must match connected wallet
);
```

#### 5. "Out of gas" on vote casting

**Problem**: Transaction gas limit too low.

**Solution**: Increase gas limit:
```typescript
await castVote(channelId, encrypted, proof, {
  gasLimit: 500000n, // Increase if needed
});
```

#### 6. Vercel 404 on page refresh

**Problem**: SPA routing not configured.

**Solution**: Ensure `vercel.json` exists:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔧 Advanced Configuration

### Hardhat Config

```javascript
// contracts/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Required for Zama FHE
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
```

### Wagmi Configuration

```typescript
// frontend/src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'VoxCircle',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
});
```

### FHE Instance Configuration

```typescript
// frontend/src/lib/fhevm.ts
import { createFhevmInstance } from '@zama-fhe/fhevm-js';

export const initFhevm = async () => {
  return await createFhevmInstance({
    network: 11155111, // Sepolia
    relayerUrl: 'http://localhost:8087', // Optional: local relayer
  });
};
```

---

## 🚀 Deployment

### Deploy to Sepolia

```bash
cd contracts

# 1. Configure environment
export SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
export DEPLOYER_PRIVATE_KEY="0x..."

# 2. Compile
npx hardhat compile

# 3. Deploy
npx hardhat run scripts/deploy.js --network sepolia

# Output:
# ✅ FHESocial deployed to: 0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7
```

### Deploy Frontend to Vercel

```bash
cd frontend

# 1. Install Vercel CLI
npm i -g vercel

# 2. Configure environment variables
# Add to Vercel dashboard:
# VITE_CONTRACT_ADDRESS=0x699FeE6Ae291966796D01eF5e3234Da0C10bB2f7

# 3. Deploy
vercel --prod

# OR use token:
vercel --token YOUR_TOKEN --name voxcircle --prod
```

**Critical**: Ensure `vercel.json` exists for SPA routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Set Custom Domain

```bash
# Set alias
vercel alias set YOUR_DEPLOYMENT_URL.vercel.app voxcircle.vercel.app
```

---

## 📊 Gas Costs

### Contract Deployment

| Contract | Gas Used | Cost (@ 50 gwei) |
|----------|----------|------------------|
| FHESocial | ~3.2M | ~0.16 ETH |

### User Operations

| Operation | Gas Used | Cost (@ 50 gwei) |
|-----------|----------|------------------|
| Register User | ~60k | ~0.003 ETH |
| Create Channel | ~100k | ~0.005 ETH |
| Create Channel + Vote | ~180k | ~0.009 ETH |
| Cast Vote (FHE) | ~120k | ~0.006 ETH |
| Post Message | ~80k | ~0.004 ETH |
| End Vote | ~40k | ~0.002 ETH |

### Optimization History

**Original Implementation** (with loops):
- Create vote: ~150k gas
- Cast vote (2 options): ~350k gas
- Cast vote (10 options): **FAILED** (>12M gas)

**Optimized Implementation** (direct storage):
- Create vote: ~100k gas
- Cast vote (any options): ~120k gas
- **Result**: 66% gas reduction, constant cost

---

## 🔐 Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**: All state changes before external calls
2. **Access Control**: `onlyRegistered` modifier for sensitive functions
3. **Input Validation**: Length checks on all user inputs
4. **Overflow Protection**: Solidity 0.8.24 has built-in checks
5. **FHE ACL**: Proper `FHE.allowThis()` calls for encrypted data

### Frontend Security

1. **No Private Keys**: All signing happens in browser wallet
2. **Input Sanitization**: XSS protection via React's default escaping
3. **HTTPS Only**: Enforce secure connections in production
4. **CSP Headers**: Configure Content Security Policy

### Vote Privacy

1. **Client-Side Encryption**: Votes encrypted before leaving browser
2. **Zero-Knowledge Proofs**: Input proofs validate encrypted data
3. **No Plaintext Leakage**: Blockchain never sees plaintext votes
4. **ACL Management**: Only contract can access encrypted storage

### Recommended Audits

Before mainnet deployment:
- ✅ OpenZeppelin security audit
- ✅ Zama FHE integration review
- ✅ Gas optimization verification
- ✅ Frontend penetration testing

---

## 📚 Technical Deep Dive

### FHE Cryptography

VoxCircle uses **Zama's TFHE** (Torus Fully Homomorphic Encryption):

1. **Encryption**: Client encrypts vote using lattice-based cryptography
2. **Homomorphic Operations**: Contract can perform comparisons without decryption
3. **Decryption**: (Future) Threshold decryption after vote ends

**Key Properties**:
- **IND-CPA Secure**: Indistinguishable ciphertexts under chosen-plaintext attack
- **Circuit Privacy**: Operations on ciphertexts don't reveal operands
- **Bootstrapping**: Noise management for complex computations

### Solidity FHE API

```solidity
// Import Zama library
import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";

// Convert external encrypted data to internal type
euint8 encrypted = FHE.fromExternal(externalValue, proof);

// Perform homomorphic operations
ebool isEqual = FHE.eq(encrypted, FHE.asEuint8(5));
euint8 sum = FHE.add(encrypted1, encrypted2);
euint8 selected = FHE.select(condition, ifTrue, ifFalse);

// Access control (allow contract to use encrypted value)
FHE.allowThis(encrypted);

// Decryption (requires gateway in production)
uint8 decrypted = FHE.decrypt(encrypted);
```

### Frontend FHE Integration

```typescript
import { createFhevmInstance } from '@zama-fhe/fhevm-js';

// 1. Initialize FHE instance
const instance = await createFhevmInstance({
  network: 11155111, // Sepolia
});

// 2. Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(42);  // Add 8-bit integer
input.add16(1000);  // Add 16-bit integer
input.add32(1000000);  // Add 32-bit integer

// 3. Encrypt data
const encrypted = input.encrypt();
// Returns: { handles: [handle1, handle2, ...], inputProof: "0x..." }

// 4. Submit to contract
await contract.someFunction(
  encrypted.handles[0],
  encrypted.inputProof
);
```

---

## 🎓 Learning Resources

### Zama FHE Documentation
- [fhEVM Docs](https://docs.zama.ai/fhevm)
- [TFHE-rs Library](https://docs.zama.ai/tfhe-rs)
- [Getting Started Guide](https://docs.zama.ai/fhevm/getting-started)

### Example Projects
- [Encrypted ERC-20](https://github.com/zama-ai/fhevm/blob/main/examples/EncryptedERC20.sol)
- [Blind Auction](https://github.com/zama-ai/fhevm/blob/main/examples/BlindAuction.sol)
- [Voting Contract](https://github.com/zama-ai/fhevm/blob/main/examples/Voting.sol)

### Community
- [Zama Discord](https://discord.com/invite/fhe)
- [GitHub Discussions](https://github.com/zama-ai/fhevm/discussions)
- [Zama Blog](https://www.zama.ai/blog)

---

## 🌟 Future Roadmap

### Phase 1: Core Features (Current)
- ✅ User registration
- ✅ Channel creation
- ✅ Encrypted voting
- ✅ Message posting
- ✅ Anonymous messages

### Phase 2: Enhanced Voting
- ⏳ Vote result decryption (gateway integration)
- ⏳ Weighted voting (token-based)
- ⏳ Quadratic voting
- ⏳ Multi-choice voting (select N of M)
- ⏳ Vote delegation

### Phase 3: Advanced Features
- ⏳ Direct encrypted messaging
- ⏳ Channel moderation (encrypted mod actions)
- ⏳ Reputation system (encrypted scores)
- ⏳ File attachments (encrypted IPFS)
- ⏳ User profiles (encrypted fields)

### Phase 4: Scalability
- ⏳ Layer 2 integration (zkSync, Optimism)
- ⏳ IPFS/Arweave for message storage
- ⏳ Subgraph indexing
- ⏳ Mobile app (React Native)
- ⏳ Desktop app (Electron)

### Phase 5: Governance
- ⏳ DAO treasury management
- ⏳ Protocol upgrades via voting
- ⏳ Fee mechanism (token-gated features)
- ⏳ Revenue sharing

---

## 📄 License

MIT License

Copyright (c) 2025 VoxCircle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (Prettier + ESLint)
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Test thoroughly on Sepolia before submitting

### Reporting Issues

Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

---

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/qvzfjgd8cvfc/fhe-social/issues)
- **Live Demo**: https://voxcircle.vercel.app
- **Zama Discord**: https://discord.com/invite/fhe

---

## 🙏 Acknowledgments

- **Zama Team**: For pioneering FHE technology and fhEVM
- **Ethereum Foundation**: For Sepolia testnet
- **Hardhat Team**: For excellent development tools
- **RainbowKit**: For seamless wallet integration
- **Vercel**: For hosting and deployment

---

**Built with ❤️ using Zama FHE**
