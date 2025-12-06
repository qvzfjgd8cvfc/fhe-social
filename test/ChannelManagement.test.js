/**
 * Channel Management Tests
 * Tests for channel creation, messaging, and pagination
 */
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");
describe("FHESocial - Channel Management", function () {
  let contract;
  let owner, user1, user2, unregistered;
  let contractAddress;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, user1, user2, unregistered] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FHESocial");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
    contractAddress = await contract.getAddress();

    // Register users for most tests
    await contract.connect(owner).register("owner");
    await contract.connect(user1).register("user1");
    await contract.connect(user2).register("user2");
  });

  describe("Channel Creation", function () {
    it("should create channel with valid parameters", async function () {
      await contract.connect(owner).createChannel("General", "General discussion channel");

      const [name, description, creator, createdAt, active] = await contract.getChannel(0);
      expect(name).to.equal("General");
      expect(description).to.equal("General discussion channel");
      expect(creator).to.equal(owner.address);
      expect(createdAt).to.be.gt(0);
      expect(active).to.equal(true);
    });

    it("should emit ChannelCreated event", async function () {
      await expect(contract.connect(owner).createChannel("Test", "Test channel"))
        .to.emit(contract, "ChannelCreated")
        .withArgs(0, "Test", owner.address);
    });

    it("should increment channel count correctly", async function () {
      expect(await contract.channelCount()).to.equal(0);

      await contract.connect(owner).createChannel("Channel 1", "First");
      expect(await contract.channelCount()).to.equal(1);

      await contract.connect(user1).createChannel("Channel 2", "Second");
      expect(await contract.channelCount()).to.equal(2);
    });

    it("should reject channel creation from unregistered user", async function () {
      await expect(
        contract.connect(unregistered).createChannel("Test", "Test")
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("Channel Name Validation", function () {
    it("should reject empty channel name", async function () {
      await expect(
        contract.connect(owner).createChannel("", "Description")
      ).to.be.revertedWith("Invalid name length");
    });

    it("should accept 1 character channel name", async function () {
      await contract.connect(owner).createChannel("X", "Single char channel");
      const [name] = await contract.getChannel(0);
      expect(name).to.equal("X");
    });

    it("should accept 64 character channel name (maximum)", async function () {
      const maxName = "a".repeat(64);
      await contract.connect(owner).createChannel(maxName, "Max length name");

      const [name] = await contract.getChannel(0);
      expect(name).to.equal(maxName);
    });

    it("should reject 65 character channel name", async function () {
      const longName = "a".repeat(65);

      await expect(
        contract.connect(owner).createChannel(longName, "Description")
      ).to.be.revertedWith("Invalid name length");
    });
  });

  describe("Message Posting", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannel("General", "Discussion");
    });

    it("should post public message successfully", async function () {
      await contract.connect(user1).postMessage(0, "Hello everyone!", false);

      const [senders, contents, isAnonymous, timestamps] = await contract.getMessages(0, 0, 10);
      expect(senders.length).to.equal(1);
      expect(senders[0]).to.equal(user1.address);
      expect(contents[0]).to.equal("Hello everyone!");
      expect(isAnonymous[0]).to.equal(false);
      expect(timestamps[0]).to.be.gt(0);
    });

    it("should post anonymous message with zero address sender", async function () {
      await contract.connect(user1).postMessage(0, "Anonymous thought", true);

      const [senders, contents, isAnonymous] = await contract.getMessages(0, 0, 10);
      expect(senders[0]).to.equal(ethers.ZeroAddress);
      expect(contents[0]).to.equal("Anonymous thought");
      expect(isAnonymous[0]).to.equal(true);
    });

    it("should emit MessagePosted event for public message", async function () {
      await expect(contract.connect(user1).postMessage(0, "Public msg", false))
        .to.emit(contract, "MessagePosted")
        .withArgs(0, user1.address, false);
    });

    it("should emit MessagePosted event for anonymous message", async function () {
      await expect(contract.connect(user1).postMessage(0, "Anon msg", true))
        .to.emit(contract, "MessagePosted")
        .withArgs(0, user1.address, true);
    });

    it("should reject empty message", async function () {
      await expect(
        contract.connect(user1).postMessage(0, "", false)
      ).to.be.revertedWith("Invalid content length");
    });

    it("should accept 1000 character message (maximum)", async function () {
      const maxMessage = "a".repeat(1000);
      await contract.connect(user1).postMessage(0, maxMessage, false);

      const [, contents] = await contract.getMessages(0, 0, 10);
      expect(contents[0]).to.equal(maxMessage);
    });

    it("should reject 1001 character message", async function () {
      const longMessage = "a".repeat(1001);

      await expect(
        contract.connect(user1).postMessage(0, longMessage, false)
      ).to.be.revertedWith("Invalid content length");
    });

    it("should reject message from unregistered user", async function () {
      await expect(
        contract.connect(unregistered).postMessage(0, "Hello", false)
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("Message Pagination", function () {
    beforeEach(async function () {
      await contract.connect(owner).createChannel("General", "Discussion");

      // Post 15 messages
      for (let i = 0; i < 15; i++) {
        await contract.connect(user1).postMessage(0, `Message ${i}`, false);
      }
    });

    it("should return correct message count", async function () {
      const count = await contract.getMessageCount(0);
      expect(count).to.equal(15);
    });

    it("should paginate correctly - first page", async function () {
      const [, contents] = await contract.getMessages(0, 0, 5);
      expect(contents.length).to.equal(5);
      expect(contents[0]).to.equal("Message 0");
      expect(contents[4]).to.equal("Message 4");
    });

    it("should paginate correctly - second page", async function () {
      const [, contents] = await contract.getMessages(0, 5, 5);
      expect(contents.length).to.equal(5);
      expect(contents[0]).to.equal("Message 5");
      expect(contents[4]).to.equal("Message 9");
    });

    it("should paginate correctly - last page with partial results", async function () {
      const [, contents] = await contract.getMessages(0, 10, 10);
      expect(contents.length).to.equal(5); // Only 5 remaining
      expect(contents[0]).to.equal("Message 10");
      expect(contents[4]).to.equal("Message 14");
    });

    it("should return empty array for offset beyond messages", async function () {
      const [, contents] = await contract.getMessages(0, 100, 10);
      expect(contents.length).to.equal(0);
    });
  });

  describe("Multiple Channels", function () {
    it("should handle messages in different channels independently", async function () {
      await contract.connect(owner).createChannel("Channel A", "First");
      await contract.connect(owner).createChannel("Channel B", "Second");

      await contract.connect(user1).postMessage(0, "Message in A", false);
      await contract.connect(user1).postMessage(1, "Message in B", false);
      await contract.connect(user2).postMessage(0, "Another in A", false);

      const countA = await contract.getMessageCount(0);
      const countB = await contract.getMessageCount(1);

      expect(countA).to.equal(2);
      expect(countB).to.equal(1);

      const [, contentsA] = await contract.getMessages(0, 0, 10);
      const [, contentsB] = await contract.getMessages(1, 0, 10);

      expect(contentsA[0]).to.equal("Message in A");
      expect(contentsA[1]).to.equal("Another in A");
      expect(contentsB[0]).to.equal("Message in B");
    });

    it("should track creators correctly", async function () {
      await contract.connect(owner).createChannel("Owner Channel", "By owner");
      await contract.connect(user1).createChannel("User1 Channel", "By user1");

      const [, , creatorA] = await contract.getChannel(0);
      const [, , creatorB] = await contract.getChannel(1);

      expect(creatorA).to.equal(owner.address);
      expect(creatorB).to.equal(user1.address);
    });
  });

  describe("Gas Optimization", function () {
    it("should use reasonable gas for channel creation", async function () {
      const tx = await contract.connect(owner).createChannel("Test", "Description");
      const receipt = await tx.wait();

      // Adjusted threshold for viaIR compilation overhead
      expect(receipt.gasUsed).to.be.lt(200000);
      console.log(`Channel creation gas: ${receipt.gasUsed}`);
    });

    it("should use reasonable gas for message posting", async function () {
      await contract.connect(owner).createChannel("Test", "Description");

      const tx = await contract.connect(user1).postMessage(0, "Test message", false);
      const receipt = await tx.wait();

      // Adjusted threshold for viaIR compilation overhead
      expect(receipt.gasUsed).to.be.lt(150000);
      console.log(`Message posting gas: ${receipt.gasUsed}`);
    });
  });
});
