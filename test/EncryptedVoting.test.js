/**
 * Encrypted Voting Tests
 * Tests for FHE-encrypted voting with euint8 storage
 */
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");
describe("FHESocial - Encrypted Voting", function () {
  let contract;
  let owner, voter1, voter2, voter3, unregistered;
  let contractAddress;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, voter1, voter2, voter3, unregistered] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FHESocial");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
    contractAddress = await contract.getAddress();

    // Register users
    await contract.connect(owner).register("owner");
    await contract.connect(voter1).register("voter1");
    await contract.connect(voter2).register("voter2");
    await contract.connect(voter3).register("voter3");
  });

  describe("Vote Creation", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannel("Voting", "Voting channel");
    });

    it("should create vote in existing channel", async function () {
      await contract.connect(owner).createVote(
        0,
        "What's your favorite color?",
        ["Red", "Green", "Blue"],
        86400
      );

      const [question, options, startTime, endTime, active] = await contract.getVoteInfo(0);
      expect(question).to.equal("What's your favorite color?");
      expect(options.length).to.equal(3);
      expect(options[0]).to.equal("Red");
      expect(options[1]).to.equal("Green");
      expect(options[2]).to.equal("Blue");
      expect(active).to.equal(true);
      expect(endTime - startTime).to.equal(86400);
    });

    it("should emit VoteCreated event", async function () {
      await expect(
        contract.connect(owner).createVote(0, "Question?", ["A", "B"], 3600)
      ).to.emit(contract, "VoteCreated");
    });

    it("should reject vote creation by non-creator", async function () {
      await expect(
        contract.connect(voter1).createVote(0, "Question?", ["A", "B"], 3600)
      ).to.be.revertedWith("Only creator can create votes");
    });

    it("should reject less than 2 options", async function () {
      await expect(
        contract.connect(owner).createVote(0, "Question?", ["Only one"], 3600)
      ).to.be.revertedWith("Invalid options count");
    });

    it("should reject more than 10 options", async function () {
      const tooMany = Array(11).fill("Option");
      await expect(
        contract.connect(owner).createVote(0, "Question?", tooMany, 3600)
      ).to.be.revertedWith("Invalid options count");
    });

    it("should accept exactly 10 options (maximum)", async function () {
      const maxOptions = Array(10).fill(0).map((_, i) => `Option ${i + 1}`);
      await contract.connect(owner).createVote(0, "Question?", maxOptions, 3600);

      const [, options] = await contract.getVoteInfo(0);
      expect(options.length).to.equal(10);
    });

    it("should reject duration less than 1 hour", async function () {
      await expect(
        contract.connect(owner).createVote(0, "Question?", ["A", "B"], 3599)
      ).to.be.revertedWith("Invalid duration");
    });

    it("should reject duration more than 90 days", async function () {
      await expect(
        contract.connect(owner).createVote(0, "Question?", ["A", "B"], 7776001)
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Channel with Vote (Atomic Creation)", function () {
    it("should create channel and vote atomically", async function () {
      await contract.connect(owner).createChannelWithVote(
        "Poll Channel",
        "A channel with active poll",
        "Should we implement feature X?",
        ["Yes", "No", "Maybe"],
        86400
      );

      const [name, , creator] = await contract.getChannel(0);
      expect(name).to.equal("Poll Channel");
      expect(creator).to.equal(owner.address);

      const [question, options, , , active] = await contract.getVoteInfo(0);
      expect(question).to.equal("Should we implement feature X?");
      expect(options.length).to.equal(3);
      expect(active).to.equal(true);
    });

    it("should emit both ChannelCreated and VoteCreated events", async function () {
      const tx = contract.connect(owner).createChannelWithVote(
        "Test",
        "Desc",
        "Question?",
        ["A", "B"],
        3600
      );

      await expect(tx)
        .to.emit(contract, "ChannelCreated")
        .and.to.emit(contract, "VoteCreated");
    });
  });

  describe("FHE Encrypted Vote Casting", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannelWithVote(
        "Poll",
        "Poll channel",
        "Pick a number",
        ["One", "Two", "Three", "Four", "Five"],
        86400
      );
    });

    it("should cast encrypted vote successfully using FHE.fromExternal()", async function () {
      const voteChoice = 2; // "Three"

      // Create FHE encrypted input
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(BigInt(voteChoice))
        .encrypt();

      // Cast the encrypted vote
      await contract.connect(voter1).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Verify vote was recorded
      const hasVoted = await contract.hasUserVoted(0, voter1.address);
      expect(hasVoted).to.equal(true);
    });

    it("should emit VoteCast event", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.emit(contract, "VoteCast")
        .withArgs(0, voter1.address);
    });

    it("should prevent double voting", async function () {
      const encrypted1 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await contract.connect(voter1).castVote(0, encrypted1.handles[0], encrypted1.inputProof);

      const encrypted2 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(1n)
        .encrypt();

      await expect(
        contract.connect(voter1).castVote(0, encrypted2.handles[0], encrypted2.inputProof)
      ).to.be.revertedWith("Already voted");
    });

    it("should reject vote from unregistered user", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, unregistered.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(unregistered).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Not registered");
    });

    it("should allow all options (0-4) to be voted", async function () {
      const voters = [voter1, voter2, voter3];
      const choices = [0, 2, 4]; // First, middle, last

      for (let i = 0; i < voters.length; i++) {
        const encrypted = await fhevm
          .createEncryptedInput(contractAddress, voters[i].address)
          .add8(BigInt(choices[i]))
          .encrypt();

        await contract.connect(voters[i]).castVote(
          0,
          encrypted.handles[0],
          encrypted.inputProof
        );

        expect(await contract.hasUserVoted(0, voters[i].address)).to.equal(true);
      }
    });

    it("should accept vote for maximum option index (9)", async function () {
      // Create channel with 10 options
      await contract.connect(owner).createChannelWithVote(
        "Max Options",
        "10 options poll",
        "Choose one",
        Array(10).fill(0).map((_, i) => `Option ${i}`),
        3600
      );

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(9n) // Last option
        .encrypt();

      await contract.connect(voter1).castVote(1, encrypted.handles[0], encrypted.inputProof);
      expect(await contract.hasUserVoted(1, voter1.address)).to.equal(true);
    });
  });

  describe("Vote Timing", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannelWithVote(
        "Timed Poll",
        "Time-limited poll",
        "Quick decision?",
        ["Yes", "No"],
        3600 // 1 hour
      );
    });

    it("should accept vote before deadline", async function () {
      // Advance time but stay within deadline
      await ethers.provider.send("evm_increaseTime", [1800]); // 30 minutes
      await ethers.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await contract.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof);
      expect(await contract.hasUserVoted(0, voter1.address)).to.equal(true);
    });

    it("should reject vote after deadline", async function () {
      // Advance time past deadline
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Vote ended");
    });

    it("should reject vote on manually ended poll", async function () {
      await contract.connect(owner).endVote(0);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Vote not active");
    });
  });

  describe("Vote Ending", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannelWithVote(
        "Poll",
        "Description",
        "Question?",
        ["A", "B"],
        86400
      );
    });

    it("should allow creator to end vote early", async function () {
      await contract.connect(owner).endVote(0);

      const [, , , , active] = await contract.getVoteInfo(0);
      expect(active).to.equal(false);
    });

    it("should reject early end by non-creator", async function () {
      await expect(
        contract.connect(voter1).endVote(0)
      ).to.be.revertedWith("Cannot end vote yet");
    });

    it("should allow anyone to end vote after deadline", async function () {
      // Advance past deadline
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);

      // Non-creator can end it
      await contract.connect(voter1).endVote(0);

      const [, , , , active] = await contract.getVoteInfo(0);
      expect(active).to.equal(false);
    });

    it("should end vote successfully", async function () {
      await contract.connect(owner).endVote(0);

      const [, , , , active] = await contract.getVoteInfo(0);
      expect(active).to.equal(false);
    });
  });

  describe("FHE Proof Validation", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannelWithVote(
        "Poll",
        "Description",
        "Question?",
        ["A", "B", "C"],
        86400
      );
    });

    it("should reject invalid FHE proof", async function () {
      const validEncrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(1n)
        .encrypt();

      // Use valid handle but invalid proof
      const invalidProof = "0x" + "00".repeat(64);

      await expect(
        contract.connect(voter1).castVote(0, validEncrypted.handles[0], invalidProof)
      ).to.be.reverted;
    });

    it("should reject mismatched handle and proof", async function () {
      const encrypted1 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      const encrypted2 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(1n)
        .encrypt();

      // Mix handle from one encryption with proof from another
      await expect(
        contract.connect(voter1).castVote(0, encrypted1.handles[0], encrypted2.inputProof)
      ).to.be.reverted;
    });

    it("should validate FHE.fromExternal() correctly", async function () {
      // This test verifies the contract properly validates encrypted input
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(2n)
        .encrypt();

      // Should succeed with valid handle and proof
      await expect(
        contract.connect(voter1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.not.be.reverted;
    });
  });

  describe("Multiple Votes Across Channels", function () {
    beforeEach(async function () {
      for (let i = 0; i < 3; i++) {
        await contract.connect(owner).createChannelWithVote(
          `Channel ${i}`,
          `Description ${i}`,
          `Question ${i}?`,
          ["Option A", "Option B"],
          86400
        );
      }
    });

    it("should allow same user to vote in multiple channels", async function () {
      for (let channelId = 0; channelId < 3; channelId++) {
        const encrypted = await fhevm
          .createEncryptedInput(contractAddress, voter1.address)
          .add8(BigInt(channelId % 2))
          .encrypt();

        await contract.connect(voter1).castVote(
          channelId,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // Verify all votes recorded
      for (let channelId = 0; channelId < 3; channelId++) {
        expect(await contract.hasUserVoted(channelId, voter1.address)).to.equal(true);
      }
    });

    it("should track votes independently per channel", async function () {
      // Vote only in channel 1
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n)
        .encrypt();

      await contract.connect(voter1).castVote(1, encrypted.handles[0], encrypted.inputProof);

      // Verify vote status per channel
      expect(await contract.hasUserVoted(0, voter1.address)).to.equal(false);
      expect(await contract.hasUserVoted(1, voter1.address)).to.equal(true);
      expect(await contract.hasUserVoted(2, voter1.address)).to.equal(false);
    });
  });

  describe("Gas Optimization for FHE Operations", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannelWithVote(
        "Gas Test",
        "Gas optimization test",
        "Question?",
        Array(10).fill(0).map((_, i) => `Option ${i}`),
        86400
      );
    });

    it("should use reasonable gas for encrypted vote", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(5n)
        .encrypt();

      const tx = await contract.connect(voter1).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );
      const receipt = await tx.wait();

      // FHE voting should use less than 200k gas
      expect(receipt.gasUsed).to.be.lt(200000);
      console.log(`FHE vote gas used: ${receipt.gasUsed}`);
    });

    it("should have constant gas cost regardless of vote option", async function () {
      const encrypted0 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(0n) // First option
        .encrypt();

      const tx1 = await contract.connect(voter1).castVote(
        0,
        encrypted0.handles[0],
        encrypted0.inputProof
      );
      const receipt1 = await tx1.wait();

      // Create second poll for comparison
      await contract.connect(owner).createChannelWithVote(
        "Gas Test 2",
        "Second test",
        "Question 2?",
        Array(10).fill(0).map((_, i) => `Option ${i}`),
        86400
      );

      const encrypted9 = await fhevm
        .createEncryptedInput(contractAddress, voter1.address)
        .add8(9n) // Last option
        .encrypt();

      const tx2 = await contract.connect(voter1).castVote(
        1,
        encrypted9.handles[0],
        encrypted9.inputProof
      );
      const receipt2 = await tx2.wait();

      // Gas difference should be minimal (within 5%)
      const gasDiff = Math.abs(Number(receipt1.gasUsed) - Number(receipt2.gasUsed));
      const avgGas = (Number(receipt1.gasUsed) + Number(receipt2.gasUsed)) / 2;
      expect(gasDiff / avgGas).to.be.lt(0.05);

      console.log(`Vote option 0 gas: ${receipt1.gasUsed}`);
      console.log(`Vote option 9 gas: ${receipt2.gasUsed}`);
    });
  });
});
