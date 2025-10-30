const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHESocial Contract", function () {
  let fheSocial;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy FHESocial contract
    const FHESocial = await ethers.getContractFactory("FHESocial");
    fheSocial = await FHESocial.deploy();
    await fheSocial.waitForDeployment();

    console.log("FHESocial deployed to:", await fheSocial.getAddress());
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      await fheSocial.connect(user1).register("Alice");

      const userInfo = await fheSocial.getUser(user1.address);
      expect(userInfo.username).to.equal("Alice");
      expect(userInfo.registered).to.be.true;
      expect(userInfo.registeredAt).to.be.gt(0);
    });

    it("Should emit UserRegistered event", async function () {
      await expect(fheSocial.connect(user1).register("Alice"))
        .to.emit(fheSocial, "UserRegistered")
        .withArgs(user1.address, "Alice");
    });

    it("Should fail to register with empty username", async function () {
      await expect(fheSocial.connect(user1).register("")).to.be.revertedWith(
        "Invalid username length"
      );
    });

    it("Should fail to register with username too long", async function () {
      const longUsername = "a".repeat(33); // 33 characters
      await expect(
        fheSocial.connect(user1).register(longUsername)
      ).to.be.revertedWith("Invalid username length");
    });

    it("Should fail to register twice", async function () {
      await fheSocial.connect(user1).register("Alice");
      await expect(fheSocial.connect(user1).register("Bob")).to.be.revertedWith(
        "Already registered"
      );
    });

    it("Should allow multiple users to register", async function () {
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user2).register("Bob");
      await fheSocial.connect(user3).register("Charlie");

      const user1Info = await fheSocial.getUser(user1.address);
      const user2Info = await fheSocial.getUser(user2.address);
      const user3Info = await fheSocial.getUser(user3.address);

      expect(user1Info.username).to.equal("Alice");
      expect(user2Info.username).to.equal("Bob");
      expect(user3Info.username).to.equal("Charlie");
    });
  });

  describe("Channel Management", function () {
    beforeEach(async function () {
      // Register users first
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user2).register("Bob");
    });

    it("Should create a new channel", async function () {
      await fheSocial
        .connect(user1)
        .createChannel("General", "General discussion");

      const channelInfo = await fheSocial.getChannel(0);
      expect(channelInfo.name).to.equal("General");
      expect(channelInfo.description).to.equal("General discussion");
      expect(channelInfo.creator).to.equal(user1.address);
      expect(channelInfo.active).to.be.true;
    });

    it("Should emit ChannelCreated event", async function () {
      await expect(
        fheSocial.connect(user1).createChannel("General", "General discussion")
      )
        .to.emit(fheSocial, "ChannelCreated")
        .withArgs(0, "General", user1.address);
    });

    it("Should fail to create channel if not registered", async function () {
      await expect(
        fheSocial.connect(user3).createChannel("General", "General discussion")
      ).to.be.revertedWith("Not registered");
    });

    it("Should increment channel count", async function () {
      await fheSocial.connect(user1).createChannel("Channel1", "Desc1");
      await fheSocial.connect(user2).createChannel("Channel2", "Desc2");

      const count = await fheSocial.channelCount();
      expect(count).to.equal(2);
    });

    it("Should fail with empty channel name", async function () {
      await expect(
        fheSocial.connect(user1).createChannel("", "Description")
      ).to.be.revertedWith("Invalid channel name");
    });

    it("Should fail with channel name too long", async function () {
      const longName = "a".repeat(101);
      await expect(
        fheSocial.connect(user1).createChannel(longName, "Description")
      ).to.be.revertedWith("Invalid channel name");
    });
  });

  describe("Message Posting", function () {
    beforeEach(async function () {
      // Register users
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user2).register("Bob");

      // Create a channel
      await fheSocial
        .connect(user1)
        .createChannel("General", "General discussion");
    });

    it("Should post a public message", async function () {
      await fheSocial
        .connect(user1)
        .postMessage(0, "Hello World!", false);

      const messages = await fheSocial.getMessages(0, 0, 10);
      expect(messages[0][0]).to.equal(user1.address); // sender
      expect(messages[1][0]).to.equal("Hello World!"); // content
      expect(messages[2][0]).to.be.false; // isAnonymous
    });

    it("Should post an anonymous message", async function () {
      await fheSocial
        .connect(user1)
        .postMessage(0, "Secret message", true);

      const messages = await fheSocial.getMessages(0, 0, 10);
      expect(messages[2][0]).to.be.true; // isAnonymous
    });

    it("Should emit MessagePosted event", async function () {
      await expect(
        fheSocial.connect(user1).postMessage(0, "Hello!", false)
      )
        .to.emit(fheSocial, "MessagePosted")
        .withArgs(0, user1.address, false);
    });

    it("Should fail to post message if not registered", async function () {
      await expect(
        fheSocial.connect(user3).postMessage(0, "Hello!", false)
      ).to.be.revertedWith("Not registered");
    });

    it("Should fail to post empty message", async function () {
      await expect(
        fheSocial.connect(user1).postMessage(0, "", false)
      ).to.be.revertedWith("Empty message");
    });

    it("Should fail to post message too long", async function () {
      const longMessage = "a".repeat(1001);
      await expect(
        fheSocial.connect(user1).postMessage(0, longMessage, false)
      ).to.be.revertedWith("Message too long");
    });

    it("Should fail to post to non-existent channel", async function () {
      await expect(
        fheSocial.connect(user1).postMessage(999, "Hello!", false)
      ).to.be.revertedWith("Invalid channel");
    });

    it("Should retrieve messages with pagination", async function () {
      // Post multiple messages
      await fheSocial.connect(user1).postMessage(0, "Message 1", false);
      await fheSocial.connect(user2).postMessage(0, "Message 2", false);
      await fheSocial.connect(user1).postMessage(0, "Message 3", true);

      // Get first 2 messages
      const messages = await fheSocial.getMessages(0, 0, 2);
      expect(messages[1].length).to.equal(2);
      expect(messages[1][0]).to.equal("Message 1");
      expect(messages[1][1]).to.equal("Message 2");

      // Get message starting from offset 1
      const messages2 = await fheSocial.getMessages(0, 1, 2);
      expect(messages2[1][0]).to.equal("Message 2");
      expect(messages2[1][1]).to.equal("Message 3");
    });
  });

  describe("Voting System", function () {
    beforeEach(async function () {
      // Register users
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user2).register("Bob");
      await fheSocial.connect(user3).register("Charlie");

      // Create a channel
      await fheSocial
        .connect(user1)
        .createChannel("Voting", "Voting channel");
    });

    it("Should create a vote for channel", async function () {
      const duration = 3600; // 1 hour
      await fheSocial
        .connect(user1)
        .createVote(0, "Best feature?", ["Feature A", "Feature B"], duration);

      const voteInfo = await fheSocial.getVoteInfo(0);
      expect(voteInfo.question).to.equal("Best feature?");
      expect(voteInfo.options).to.deep.equal(["Feature A", "Feature B"]);
      expect(voteInfo.active).to.be.true;
    });

    it("Should emit VoteCreated event", async function () {
      await expect(
        fheSocial
          .connect(user1)
          .createVote(0, "Best feature?", ["Feature A", "Feature B"], 3600)
      )
        .to.emit(fheSocial, "VoteCreated")
        .withArgs(0, "Best feature?");
    });

    it("Should fail to create vote with less than 2 options", async function () {
      await expect(
        fheSocial.connect(user1).createVote(0, "Question?", ["Only one"], 3600)
      ).to.be.revertedWith("Need 2-10 options");
    });

    it("Should fail to create vote with more than 10 options", async function () {
      const tooManyOptions = Array(11).fill("Option");
      await expect(
        fheSocial.connect(user1).createVote(0, "Question?", tooManyOptions, 3600)
      ).to.be.revertedWith("Need 2-10 options");
    });

    it("Should fail to create vote with invalid duration", async function () {
      // Too short (< 1 hour = 3600 seconds)
      await expect(
        fheSocial
          .connect(user1)
          .createVote(0, "Question?", ["A", "B"], 3599)
      ).to.be.revertedWith("Invalid duration");

      // Too long (> 90 days = 7776000 seconds)
      await expect(
        fheSocial
          .connect(user1)
          .createVote(0, "Question?", ["A", "B"], 7776001)
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should fail to create vote if not channel creator", async function () {
      await expect(
        fheSocial
          .connect(user2)
          .createVote(0, "Question?", ["A", "B"], 3600)
      ).to.be.revertedWith("Only channel creator");
    });

    it("Should fail to create vote when vote already active", async function () {
      await fheSocial
        .connect(user1)
        .createVote(0, "First vote?", ["A", "B"], 3600);

      await expect(
        fheSocial
          .connect(user1)
          .createVote(0, "Second vote?", ["C", "D"], 3600)
      ).to.be.revertedWith("Vote already active");
    });

    it("Should check if user has voted", async function () {
      await fheSocial
        .connect(user1)
        .createVote(0, "Question?", ["A", "B"], 3600);

      const hasVoted = await fheSocial.hasVoted(0, user2.address);
      expect(hasVoted).to.be.false;
    });

    it("Should end an active vote", async function () {
      await fheSocial
        .connect(user1)
        .createVote(0, "Question?", ["A", "B"], 3600);

      await fheSocial.connect(user1).endVote(0);

      const voteInfo = await fheSocial.getVoteInfo(0);
      expect(voteInfo.active).to.be.false;
    });

    it("Should fail to end vote if not channel creator", async function () {
      await fheSocial
        .connect(user1)
        .createVote(0, "Question?", ["A", "B"], 3600);

      await expect(
        fheSocial.connect(user2).endVote(0)
      ).to.be.revertedWith("Only channel creator");
    });
  });

  describe("Channel with Vote Creation", function () {
    beforeEach(async function () {
      await fheSocial.connect(user1).register("Alice");
    });

    it("Should create channel with vote atomically", async function () {
      await fheSocial
        .connect(user1)
        .createChannelWithVote(
          "Roadmap",
          "Q4 Roadmap",
          "What should we build?",
          ["Mobile", "Desktop", "API"],
          86400 // 24 hours
        );

      const channelInfo = await fheSocial.getChannel(0);
      expect(channelInfo.name).to.equal("Roadmap");

      const voteInfo = await fheSocial.getVoteInfo(0);
      expect(voteInfo.question).to.equal("What should we build?");
      expect(voteInfo.options).to.deep.equal(["Mobile", "Desktop", "API"]);
      expect(voteInfo.active).to.be.true;
    });

    it("Should emit both ChannelCreated and VoteCreated events", async function () {
      const tx = fheSocial
        .connect(user1)
        .createChannelWithVote(
          "Roadmap",
          "Q4 Roadmap",
          "What should we build?",
          ["Mobile", "Desktop"],
          86400
        );

      await expect(tx)
        .to.emit(fheSocial, "ChannelCreated")
        .withArgs(0, "Roadmap", user1.address);

      await expect(tx)
        .to.emit(fheSocial, "VoteCreated")
        .withArgs(0, "What should we build?");
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user1).createChannel("Test", "Test channel");
    });

    it("Should handle empty message retrieval", async function () {
      const messages = await fheSocial.getMessages(0, 0, 10);
      expect(messages[0].length).to.equal(0);
      expect(messages[1].length).to.equal(0);
      expect(messages[2].length).to.equal(0);
      expect(messages[3].length).to.equal(0);
    });

    it("Should handle pagination beyond message count", async function () {
      await fheSocial.connect(user1).postMessage(0, "Message 1", false);

      const messages = await fheSocial.getMessages(0, 10, 10);
      expect(messages[0].length).to.equal(0);
    });

    it("Should handle maximum username length", async function () {
      const maxUsername = "a".repeat(32);
      await fheSocial.connect(user2).register(maxUsername);

      const userInfo = await fheSocial.getUser(user2.address);
      expect(userInfo.username).to.equal(maxUsername);
    });

    it("Should handle maximum channel name length", async function () {
      const maxName = "a".repeat(100);
      await fheSocial.connect(user1).createChannel(maxName, "Description");

      const channelInfo = await fheSocial.getChannel(1);
      expect(channelInfo.name).to.equal(maxName);
    });

    it("Should handle maximum message length", async function () {
      const maxMessage = "a".repeat(1000);
      await fheSocial.connect(user1).postMessage(0, maxMessage, false);

      const messages = await fheSocial.getMessages(0, 0, 10);
      expect(messages[1][0]).to.equal(maxMessage);
    });
  });

  describe("Gas Usage Estimates", function () {
    beforeEach(async function () {
      await fheSocial.connect(user1).register("Alice");
      await fheSocial.connect(user1).createChannel("Test", "Test channel");
    });

    it("Should estimate gas for user registration", async function () {
      const tx = await fheSocial.connect(user2).register("Bob");
      const receipt = await tx.wait();
      console.log("Gas used for registration:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(100000); // Less than 100k gas
    });

    it("Should estimate gas for channel creation", async function () {
      const tx = await fheSocial
        .connect(user1)
        .createChannel("Channel", "Description");
      const receipt = await tx.wait();
      console.log("Gas used for channel creation:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(200000); // Less than 200k gas
    });

    it("Should estimate gas for message posting", async function () {
      const tx = await fheSocial
        .connect(user1)
        .postMessage(0, "Hello World!", false);
      const receipt = await tx.wait();
      console.log("Gas used for message posting:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(150000); // Less than 150k gas
    });

    it("Should estimate gas for vote creation", async function () {
      const tx = await fheSocial
        .connect(user1)
        .createVote(0, "Question?", ["A", "B", "C"], 3600);
      const receipt = await tx.wait();
      console.log("Gas used for vote creation:", receipt.gasUsed.toString());
      expect(receipt.gasUsed).to.be.lt(200000); // Less than 200k gas
    });
  });
});
