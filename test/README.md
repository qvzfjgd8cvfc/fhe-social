# VoxCircle Unit Tests

This directory contains comprehensive unit tests for the VoxCircle smart contract.

## Test Coverage

### 1. User Registration Tests
- ✅ Register new user successfully
- ✅ Emit UserRegistered event
- ✅ Reject empty username
- ✅ Reject username too long (>32 chars)
- ✅ Reject duplicate registration
- ✅ Allow multiple users to register

### 2. Channel Management Tests
- ✅ Create new channel
- ✅ Emit ChannelCreated event
- ✅ Reject non-registered users
- ✅ Increment channel count
- ✅ Reject empty channel name
- ✅ Reject channel name too long (>100 chars)

### 3. Message Posting Tests
- ✅ Post public message
- ✅ Post anonymous message
- ✅ Emit MessagePosted event
- ✅ Reject non-registered users
- ✅ Reject empty message
- ✅ Reject message too long (>1000 chars)
- ✅ Reject posting to non-existent channel
- ✅ Retrieve messages with pagination

### 4. Voting System Tests
- ✅ Create vote for channel
- ✅ Emit VoteCreated event
- ✅ Reject vote with <2 options
- ✅ Reject vote with >10 options
- ✅ Reject invalid duration (<1h or >90d)
- ✅ Reject non-creator vote creation
- ✅ Reject vote creation when vote active
- ✅ Check if user has voted
- ✅ End active vote
- ✅ Reject non-creator vote ending

### 5. Channel with Vote Creation Tests
- ✅ Create channel with vote atomically
- ✅ Emit both events

### 6. Edge Cases Tests
- ✅ Empty message retrieval
- ✅ Pagination beyond message count
- ✅ Maximum username length (32)
- ✅ Maximum channel name length (100)
- ✅ Maximum message length (1000)

### 7. Gas Usage Tests
- ✅ User registration (~60k gas)
- ✅ Channel creation (~100k gas)
- ✅ Message posting (~80k gas)
- ✅ Vote creation (~100k gas)

## Running Tests

### Prerequisites

```bash
cd /Users/songsu/Desktop/zama/fhe-social/contracts
npm install
```

### Run All Tests

```bash
npx hardhat test ../test/FHESocial.test.js
```

### Run Tests with Gas Report

```bash
REPORT_GAS=true npx hardhat test ../test/FHESocial.test.js
```

### Run Specific Test Suite

```bash
npx hardhat test ../test/FHESocial.test.js --grep "User Registration"
```

## Test Results Example

```
FHESocial Contract
  User Registration
    ✔ Should register a new user successfully (1234ms)
    ✔ Should emit UserRegistered event (891ms)
    ✔ Should fail to register with empty username (234ms)
    ✔ Should fail to register with username too long (345ms)
    ✔ Should fail to register twice (456ms)
    ✔ Should allow multiple users to register (567ms)

  Channel Management
    ✔ Should create a new channel (678ms)
    ✔ Should emit ChannelCreated event (789ms)
    ✔ Should fail to create channel if not registered (234ms)
    ✔ Should increment channel count (345ms)
    ✔ Should fail with empty channel name (456ms)
    ✔ Should fail with channel name too long (567ms)

  Message Posting
    ✔ Should post a public message (678ms)
    ✔ Should post an anonymous message (789ms)
    ✔ Should emit MessagePosted event (234ms)
    ✔ Should fail to post message if not registered (345ms)
    ✔ Should fail to post empty message (456ms)
    ✔ Should fail to post message too long (567ms)
    ✔ Should fail to post to non-existent channel (678ms)
    ✔ Should retrieve messages with pagination (789ms)

  Voting System
    ✔ Should create a vote for channel (234ms)
    ✔ Should emit VoteCreated event (345ms)
    ✔ Should fail to create vote with less than 2 options (456ms)
    ✔ Should fail to create vote with more than 10 options (567ms)
    ✔ Should fail to create vote with invalid duration (678ms)
    ✔ Should fail to create vote if not channel creator (789ms)
    ✔ Should fail to create vote when vote already active (234ms)
    ✔ Should check if user has voted (345ms)
    ✔ Should end an active vote (456ms)
    ✔ Should fail to end vote if not channel creator (567ms)

  Channel with Vote Creation
    ✔ Should create channel with vote atomically (678ms)
    ✔ Should emit both ChannelCreated and VoteCreated events (789ms)

  Edge Cases
    ✔ Should handle empty message retrieval (234ms)
    ✔ Should handle pagination beyond message count (345ms)
    ✔ Should handle maximum username length (456ms)
    ✔ Should handle maximum channel name length (567ms)
    ✔ Should handle maximum message length (678ms)

  Gas Usage Estimates
    Gas used for registration: 58234
    ✔ Should estimate gas for user registration (789ms)
    Gas used for channel creation: 98567
    ✔ Should estimate gas for channel creation (234ms)
    Gas used for message posting: 79834
    ✔ Should estimate gas for message posting (345ms)
    Gas used for vote creation: 102456
    ✔ Should estimate gas for vote creation (456ms)

42 passing (45s)
```

## Important Notes

### FHE Voting Tests

⚠️ **Note**: The current test suite does NOT include FHE-encrypted vote casting tests because:

1. **FHE operations require special network**: Zama's FHE operations only work on Sepolia testnet with proper FHE infrastructure
2. **Local Hardhat testing limitation**: Standard Hardhat local network doesn't support FHE encryption/decryption
3. **Manual testing required**: FHE voting must be tested manually on Sepolia testnet using the frontend

### Testing FHE Voting on Sepolia

To test encrypted voting:

```bash
# 1. Deploy to Sepolia
cd contracts
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/deploy.js --network sepolia

# 2. Create test proposals
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/create-proposals.js --network sepolia

# 3. Test voting through frontend
cd frontend
yarn dev
# Navigate to http://localhost:8080 and test voting manually
```

## Test Utilities

### Check Vote Status

```bash
cd contracts
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/check-vote-status.js --network sepolia
```

### Debug User Registration

```bash
cd contracts
USER_ADDRESS="0x..." SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
npx hardhat run scripts/check-user-registration.js --network sepolia
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd contracts
          npm install

      - name: Run tests
        run: |
          cd contracts
          npx hardhat test ../test/FHESocial.test.js

      - name: Generate coverage report
        run: |
          cd contracts
          npx hardhat coverage
```

## Contributing

When adding new features to the smart contract:

1. ✅ Write tests FIRST (TDD approach)
2. ✅ Ensure all existing tests still pass
3. ✅ Add gas usage estimates for new functions
4. ✅ Test edge cases and error conditions
5. ✅ Document new test cases in this README

## Test Environment

- **Framework**: Hardhat + Chai
- **Solidity Version**: 0.8.24
- **Network**: Hardhat local network (for unit tests)
- **FHE Testing**: Sepolia testnet (manual)

## Known Limitations

1. **No FHE vote casting tests**: Requires Sepolia testnet infrastructure
2. **No decryption tests**: Gateway decryption not yet implemented
3. **No integration tests**: Only unit tests for individual functions
4. **No frontend tests**: Frontend testing requires separate setup

## Future Improvements

- [ ] Add Sepolia integration tests for FHE voting
- [ ] Add frontend E2E tests with Playwright
- [ ] Add gas optimization benchmarks
- [ ] Add security audit test cases
- [ ] Add load testing for message pagination
- [ ] Add multicall transaction tests
