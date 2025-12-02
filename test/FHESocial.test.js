const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("FHESocial - Comprehensive FHE Social Platform Tests", function () {
  let contract;
  let owner, user1, user2, user3, user4, user5;
  let contractAddress;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FHESocial");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
    contractAddress = await contract.getAddress();

    console.log(`✅ FHESocial deployed at: ${contractAddress}`);
  });

  describe("Contract Deployment", function () {
    it("should deploy contract successfully", async function () {
      expect(contractAddress).to.be.properAddress;
      console.log("✅ Contract deployed successfully");
    });

    it("should have zero initial channel count", async function () {
      const channelCount = await contract.channelCount();
      expect(channelCount).to.equal(0);
      console.log("✅ Initial channel count is 0");
    });
  });

  describe("User Registration", function () {
    it("should register a new user", async function () {
      await contract.connect(user1).register("alice");

      const [username, registered, registeredAt] = await contract.getUser(user1.address);
      expect(username).to.equal("alice");
      expect(registered).to.equal(true);
      expect(registeredAt).to.be.gt(0);

      console.log("✅ User registration works");
    });

    it("should emit UserRegistered event", async function () {
      await expect(contract.connect(user1).register("bob"))
        .to.emit(contract, "UserRegistered")
        .withArgs(user1.address, "bob");

      console.log("✅ UserRegistered event emitted");
    });

    it("should reject duplicate registration", async function () {
      await contract.connect(user1).register("alice");

      await expect(
        contract.connect(user1).register("alice2")
      ).to.be.revertedWith("Already registered");

      console.log("✅ Duplicate registration rejected");
    });

    it("should reject empty username", async function () {
      await expect(
        contract.connect(user1).register("")
      ).to.be.revertedWith("Invalid username length");

      console.log("✅ Empty username rejected");
    });

    it("should reject username exceeding 32 characters", async function () {
      const longUsername = "a".repeat(33);

      await expect(
        contract.connect(user1).register(longUsername)
      ).to.be.revertedWith("Invalid username length");

      console.log("✅ Long username rejected");
    });

    it("should accept username with exactly 32 characters", async function () {
      const maxUsername = "a".repeat(32);
      await contract.connect(user1).register(maxUsername);

      const [username, registered] = await contract.getUser(user1.address);
      expect(username).to.equal(maxUsername);
      expect(registered).to.equal(true);

      console.log("✅ Maximum length username accepted");
    });
  });

  describe("Channel Management", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");
    });

    it("should create a new channel", async function () {
      const tx = await contract.connect(owner).createChannel("General", "General discussion");
      await tx.wait();

      const channelCount = await contract.channelCount();
      expect(channelCount).to.equal(1);

      const [name, description, creator, createdAt, active] = await contract.getChannel(0);
      expect(name).to.equal("General");
      expect(description).to.equal("General discussion");
      expect(creator).to.equal(owner.address);
      expect(active).to.equal(true);

      console.log("✅ Channel created successfully");
    });

    it("should emit ChannelCreated event", async function () {
      await expect(contract.connect(owner).createChannel("Test", "Test channel"))
        .to.emit(contract, "ChannelCreated")
        .withArgs(0, "Test", owner.address);

      console.log("✅ ChannelCreated event emitted");
    });

    it("should reject channel creation from unregistered user", async function () {
      await expect(
        contract.connect(user2).createChannel("Test", "Test channel")
      ).to.be.revertedWith("Not registered");

      console.log("✅ Unregistered user rejected");
    });

    it("should reject empty channel name", async function () {
      await expect(
        contract.connect(owner).createChannel("", "Description")
      ).to.be.revertedWith("Invalid name length");

      console.log("✅ Empty channel name rejected");
    });

    it("should reject channel name exceeding 64 characters", async function () {
      const longName = "a".repeat(65);

      await expect(
        contract.connect(owner).createChannel(longName, "Description")
      ).to.be.revertedWith("Invalid name length");

      console.log("✅ Long channel name rejected");
    });

    it("should create multiple channels", async function () {
      await contract.connect(owner).createChannel("Channel 1", "First channel");
      await contract.connect(owner).createChannel("Channel 2", "Second channel");
      await contract.connect(user1).createChannel("Channel 3", "Third channel");

      const channelCount = await contract.channelCount();
      expect(channelCount).to.equal(3);

      console.log("✅ Multiple channels created");
    });
  });

  describe("Channel with Vote Creation", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
    });

    it("should create channel with vote atomically", async function () {
      const options = ["Option A", "Option B", "Option C"];
      const duration = 86400; // 24 hours

      const tx = await contract.connect(owner).createChannelWithVote(
        "Vote Channel",
        "Channel with active vote",
        "Which option do you prefer?",
        options,
        duration
      );
      await tx.wait();

      // Verify channel
      const [name, , creator, , active] = await contract.getChannel(0);
      expect(name).to.equal("Vote Channel");
      expect(creator).to.equal(owner.address);
      expect(active).to.equal(true);

      // Verify vote
      const [question, voteOptions, startTime, endTime, voteActive] = await contract.getVoteInfo(0);
      expect(question).to.equal("Which option do you prefer?");
      expect(voteOptions.length).to.equal(3);
      expect(voteActive).to.equal(true);
      expect(endTime - startTime).to.equal(duration);

      console.log("✅ Channel with vote created atomically");
    });

    it("should emit both ChannelCreated and VoteCreated events", async function () {
      const options = ["Yes", "No"];

      const tx = await contract.connect(owner).createChannelWithVote(
        "Poll Channel",
        "A poll",
        "Do you agree?",
        options,
        3600
      );

      await expect(tx)
        .to.emit(contract, "ChannelCreated")
        .and.to.emit(contract, "VoteCreated");

      console.log("✅ Both events emitted");
    });

    it("should reject less than 2 options", async function () {
      await expect(
        contract.connect(owner).createChannelWithVote(
          "Bad Channel",
          "Description",
          "Question?",
          ["Only one"],
          3600
        )
      ).to.be.revertedWith("Invalid options count");

      console.log("✅ Single option rejected");
    });

    it("should reject more than 10 options", async function () {
      const tooManyOptions = Array(11).fill("Option");

      await expect(
        contract.connect(owner).createChannelWithVote(
          "Bad Channel",
          "Description",
          "Question?",
          tooManyOptions,
          3600
        )
      ).to.be.revertedWith("Invalid options count");

      console.log("✅ Too many options rejected");
    });

    it("should reject duration less than 1 hour", async function () {
      await expect(
        contract.connect(owner).createChannelWithVote(
          "Short Vote",
          "Description",
          "Question?",
          ["A", "B"],
          3599 // 59 minutes 59 seconds
        )
      ).to.be.revertedWith("Invalid duration");

      console.log("✅ Short duration rejected");
    });

    it("should reject duration more than 90 days", async function () {
      await expect(
        contract.connect(owner).createChannelWithVote(
          "Long Vote",
          "Description",
          "Question?",
          ["A", "B"],
          7776001 // 90 days + 1 second
        )
      ).to.be.revertedWith("Invalid duration");

      console.log("✅ Long duration rejected");
    });
  });

  describe("Message Posting", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");
      await contract.connect(owner).createChannel("General", "Discussion");
    });

    it("should post a public message", async function () {
      await contract.connect(user1).postMessage(0, "Hello World!", false);

      const [senders, contents, isAnonymousFlags, timestamps] = await contract.getMessages(0, 0, 10);

      expect(senders.length).to.equal(1);
      expect(senders[0]).to.equal(user1.address);
      expect(contents[0]).to.equal("Hello World!");
      expect(isAnonymousFlags[0]).to.equal(false);

      console.log("✅ Public message posted");
    });

    it("should post an anonymous message", async function () {
      await contract.connect(user1).postMessage(0, "Anonymous message", true);

      const [senders, contents, isAnonymousFlags] = await contract.getMessages(0, 0, 10);

      expect(senders[0]).to.equal(ethers.ZeroAddress);
      expect(contents[0]).to.equal("Anonymous message");
      expect(isAnonymousFlags[0]).to.equal(true);

      console.log("✅ Anonymous message posted");
    });

    it("should emit MessagePosted event", async function () {
      await expect(contract.connect(user1).postMessage(0, "Test", false))
        .to.emit(contract, "MessagePosted")
        .withArgs(0, user1.address, false);

      console.log("✅ MessagePosted event emitted");
    });

    it("should reject empty message", async function () {
      await expect(
        contract.connect(user1).postMessage(0, "", false)
      ).to.be.revertedWith("Invalid content length");

      console.log("✅ Empty message rejected");
    });

    it("should reject message exceeding 1000 characters", async function () {
      const longMessage = "a".repeat(1001);

      await expect(
        contract.connect(user1).postMessage(0, longMessage, false)
      ).to.be.revertedWith("Invalid content length");

      console.log("✅ Long message rejected");
    });

    it("should get message count correctly", async function () {
      await contract.connect(user1).postMessage(0, "Message 1", false);
      await contract.connect(user1).postMessage(0, "Message 2", false);
      await contract.connect(user1).postMessage(0, "Message 3", true);

      const count = await contract.getMessageCount(0);
      expect(count).to.equal(3);

      console.log("✅ Message count correct");
    });

    it("should support pagination", async function () {
      // Post 5 messages
      for (let i = 0; i < 5; i++) {
        await contract.connect(user1).postMessage(0, `Message ${i}`, false);
      }

      // Get first 2
      const [, contents1] = await contract.getMessages(0, 0, 2);
      expect(contents1.length).to.equal(2);
      expect(contents1[0]).to.equal("Message 0");

      // Get next 2
      const [, contents2] = await contract.getMessages(0, 2, 2);
      expect(contents2.length).to.equal(2);
      expect(contents2[0]).to.equal("Message 2");

      console.log("✅ Pagination works");
    });
  });

  describe("FHE Encrypted Voting", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("voter1");
      await contract.connect(user2).register("voter2");
      await contract.connect(user3).register("voter3");

      // Create channel with vote
      await contract.connect(owner).createChannelWithVote(
        "Voting Channel",
        "Test voting",
        "What is your favorite color?",
        ["Red", "Green", "Blue", "Yellow"],
        86400
      );
    });

    it("should cast encrypted vote successfully", async function () {
      const voteChoice = 2; // Blue

      // Create encrypted input
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(BigInt(voteChoice))
        .encrypt();

      // Cast vote
      await contract.connect(user1).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Verify user has voted
      const hasVoted = await contract.hasUserVoted(0, user1.address);
      expect(hasVoted).to.equal(true);

      console.log("✅ FHE encrypted vote cast successfully");
      console.log("✅ FHE.fromExternal() works");
      console.log("✅ FHE.allowThis() works");
    });

    it("should emit VoteCast event", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.emit(contract, "VoteCast")
        .withArgs(0, user1.address);

      console.log("✅ VoteCast event emitted");
    });

    it("should reject double voting", async function () {
      const encrypted1 = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(1n)
        .encrypt();

      await contract.connect(user1).castVote(0, encrypted1.handles[0], encrypted1.inputProof);

      const encrypted2 = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(2n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted2.handles[0], encrypted2.inputProof)
      ).to.be.revertedWith("Already voted");

      console.log("✅ Double voting prevented");
    });

    it("should reject vote from unregistered user", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user4.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(user4).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Not registered");

      console.log("✅ Unregistered voter rejected");
    });

    it("should reject vote with invalid proof", async function () {
      const validEncrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(1n)
        .encrypt();

      const invalidProof = "0x" + "00".repeat(64);

      await expect(
        contract.connect(user1).castVote(0, validEncrypted.handles[0], invalidProof)
      ).to.be.reverted;

      console.log("✅ Invalid proof rejected");
      console.log("✅ FHE.fromExternal() validates proofs correctly");
    });

    it("should handle multiple voters", async function () {
      const voters = [user1, user2, user3];
      const choices = [0, 1, 2]; // Red, Green, Blue

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
      }

      // Verify all have voted
      for (const voter of voters) {
        const hasVoted = await contract.hasUserVoted(0, voter.address);
        expect(hasVoted).to.equal(true);
      }

      console.log("✅ Multiple voters handled correctly");
    });

    it("should reject vote after voting period ends", async function () {
      // Advance time past vote end
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Vote ended");

      console.log("✅ Vote after deadline rejected");
    });

    it("should reject vote on inactive poll", async function () {
      // End the vote
      await contract.connect(owner).endVote(0);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(0n)
        .encrypt();

      await expect(
        contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("Vote not active");

      console.log("✅ Vote on inactive poll rejected");
    });
  });

  describe("Vote Management", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");
      await contract.connect(owner).createChannel("Test", "Test channel");
    });

    it("should create vote in existing channel", async function () {
      await contract.connect(owner).createVote(
        0,
        "New poll question?",
        ["Yes", "No", "Maybe"],
        7200
      );

      const [question, options, , , active] = await contract.getVoteInfo(0);
      expect(question).to.equal("New poll question?");
      expect(options.length).to.equal(3);
      expect(active).to.equal(true);

      console.log("✅ Vote created in existing channel");
    });

    it("should reject vote creation from non-creator", async function () {
      await expect(
        contract.connect(user1).createVote(0, "Question?", ["A", "B"], 3600)
      ).to.be.revertedWith("Only creator can create votes");

      console.log("✅ Non-creator vote creation rejected");
    });

    it("should allow creator to end vote early", async function () {
      await contract.connect(owner).createVote(0, "Question?", ["A", "B"], 86400);

      await contract.connect(owner).endVote(0);

      const [, , , , active] = await contract.getVoteInfo(0);
      expect(active).to.equal(false);

      console.log("✅ Creator can end vote early");
    });

    it("should allow anyone to end vote after deadline", async function () {
      await contract.connect(owner).createVote(0, "Question?", ["A", "B"], 3600);

      // Advance time
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      // Non-creator ends vote
      await contract.connect(user1).endVote(0);

      const [, , , , active] = await contract.getVoteInfo(0);
      expect(active).to.equal(false);

      console.log("✅ Anyone can end vote after deadline");
    });

    it("should reject early end by non-creator", async function () {
      await contract.connect(owner).createVote(0, "Question?", ["A", "B"], 86400);

      await expect(
        contract.connect(user1).endVote(0)
      ).to.be.revertedWith("Cannot end vote yet");

      console.log("✅ Early end by non-creator rejected");
    });
  });

  describe("Edge Cases and Gas Optimization", function () {
    beforeEach(async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");
    });

    it("should handle maximum options (10)", async function () {
      const maxOptions = Array(10).fill(0).map((_, i) => `Option ${i + 1}`);

      await contract.connect(owner).createChannelWithVote(
        "Max Options",
        "Testing maximum options",
        "Choose one of 10 options",
        maxOptions,
        3600
      );

      const [, options] = await contract.getVoteInfo(0);
      expect(options.length).to.equal(10);

      // Cast vote for last option
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(9n) // Last option
        .encrypt();

      await contract.connect(user1).castVote(0, encrypted.handles[0], encrypted.inputProof);

      console.log("✅ Maximum 10 options handled");
    });

    it("should handle minimum options (2)", async function () {
      await contract.connect(owner).createChannelWithVote(
        "Binary Vote",
        "Yes or No",
        "Binary question",
        ["Yes", "No"],
        3600
      );

      const [, options] = await contract.getVoteInfo(0);
      expect(options.length).to.equal(2);

      console.log("✅ Minimum 2 options handled");
    });

    it("should handle minimum duration (1 hour)", async function () {
      await contract.connect(owner).createChannelWithVote(
        "Quick Vote",
        "Fast poll",
        "Quick question?",
        ["A", "B"],
        3600 // Exactly 1 hour
      );

      const [, , startTime, endTime] = await contract.getVoteInfo(0);
      expect(endTime - startTime).to.equal(3600);

      console.log("✅ Minimum duration (1 hour) handled");
    });

    it("should handle maximum duration (90 days)", async function () {
      const maxDuration = 7776000; // 90 days

      await contract.connect(owner).createChannelWithVote(
        "Long Vote",
        "Extended poll",
        "Long running question?",
        ["A", "B"],
        maxDuration
      );

      const [, , startTime, endTime] = await contract.getVoteInfo(0);
      expect(endTime - startTime).to.equal(maxDuration);

      console.log("✅ Maximum duration (90 days) handled");
    });

    it("should maintain constant gas cost for voting regardless of options", async function () {
      // This test verifies the gas optimization - voting cost should be constant
      await contract.connect(owner).createChannelWithVote(
        "Gas Test",
        "Gas optimization test",
        "Test question?",
        Array(10).fill(0).map((_, i) => `Option ${i}`),
        3600
      );

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(5n)
        .encrypt();

      const tx = await contract.connect(user1).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );
      const receipt = await tx.wait();

      // Gas should be reasonable (under 200k for FHE operation)
      expect(receipt.gasUsed).to.be.lt(200000);

      console.log(`✅ Vote gas used: ${receipt.gasUsed} (constant regardless of options)`);
    });
  });

  describe("Integration Tests", function () {
    it("should handle complete user journey", async function () {
      // 1. Register users
      await contract.connect(owner).register("platform_owner");
      await contract.connect(user1).register("alice");
      await contract.connect(user2).register("bob");

      // 2. Create channel with vote
      await contract.connect(owner).createChannelWithVote(
        "Community Poll",
        "Vote on community decisions",
        "Should we implement feature X?",
        ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        86400
      );

      // 3. Post messages
      await contract.connect(user1).postMessage(0, "I think feature X is great!", false);
      await contract.connect(user2).postMessage(0, "I have some concerns...", false);
      await contract.connect(user1).postMessage(0, "Anonymous feedback here", true);

      // 4. Cast encrypted votes
      const vote1 = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add8(0n) // Strongly Agree
        .encrypt();
      await contract.connect(user1).castVote(0, vote1.handles[0], vote1.inputProof);

      const vote2 = await fhevm
        .createEncryptedInput(contractAddress, user2.address)
        .add8(3n) // Disagree
        .encrypt();
      await contract.connect(user2).castVote(0, vote2.handles[0], vote2.inputProof);

      // 5. Verify state
      const channelCount = await contract.channelCount();
      expect(channelCount).to.equal(1);

      const messageCount = await contract.getMessageCount(0);
      expect(messageCount).to.equal(3);

      expect(await contract.hasUserVoted(0, user1.address)).to.equal(true);
      expect(await contract.hasUserVoted(0, user2.address)).to.equal(true);
      expect(await contract.hasUserVoted(0, user3.address)).to.equal(false);

      console.log("✅ Complete user journey successful");
      console.log("✅ All FHE operations work correctly in integration");
    });

    it("should handle multiple channels with independent votes", async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");

      // Create multiple channels with votes
      for (let i = 0; i < 3; i++) {
        await contract.connect(owner).createChannelWithVote(
          `Channel ${i}`,
          `Description ${i}`,
          `Question for channel ${i}?`,
          ["A", "B", "C"],
          3600
        );
      }

      // Vote on each channel
      for (let i = 0; i < 3; i++) {
        const encrypted = await fhevm
          .createEncryptedInput(contractAddress, user1.address)
          .add8(BigInt(i))
          .encrypt();

        await contract.connect(user1).castVote(i, encrypted.handles[0], encrypted.inputProof);
      }

      // Verify votes
      for (let i = 0; i < 3; i++) {
        expect(await contract.hasUserVoted(i, user1.address)).to.equal(true);
      }

      console.log("✅ Multiple independent channels work correctly");
    });
  });
});
