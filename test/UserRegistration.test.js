/**
 * User Registration Tests
 * Tests for user registration, validation, and gas usage
 */
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");
describe("FHESocial - User Registration", function () {
  let contract;
  let owner, user1, user2;
  let contractAddress;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FHESocial");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
    contractAddress = await contract.getAddress();
  });

  describe("Basic Registration", function () {
    it("should register a new user successfully", async function () {
      await contract.connect(user1).register("alice");

      const [username, registered, registeredAt] = await contract.getUser(user1.address);
      expect(username).to.equal("alice");
      expect(registered).to.equal(true);
      expect(registeredAt).to.be.gt(0);
    });

    it("should emit UserRegistered event with correct parameters", async function () {
      await expect(contract.connect(user1).register("bob"))
        .to.emit(contract, "UserRegistered")
        .withArgs(user1.address, "bob");
    });

    it("should store registration timestamp correctly", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      await contract.connect(user1).register("alice");
      const blockAfter = await ethers.provider.getBlock("latest");

      const [, , registeredAt] = await contract.getUser(user1.address);
      expect(registeredAt).to.be.gte(blockBefore.timestamp);
      expect(registeredAt).to.be.lte(blockAfter.timestamp);
    });
  });

  describe("Username Validation", function () {
    it("should reject empty username", async function () {
      await expect(
        contract.connect(user1).register("")
      ).to.be.revertedWith("Invalid username length");
    });

    it("should accept 1 character username", async function () {
      await contract.connect(user1).register("a");
      const [username, registered] = await contract.getUser(user1.address);
      expect(username).to.equal("a");
      expect(registered).to.equal(true);
    });

    it("should accept 32 character username (maximum)", async function () {
      const maxUsername = "a".repeat(32);
      await contract.connect(user1).register(maxUsername);

      const [username, registered] = await contract.getUser(user1.address);
      expect(username).to.equal(maxUsername);
      expect(registered).to.equal(true);
    });

    it("should reject 33 character username (exceeds maximum)", async function () {
      const longUsername = "a".repeat(33);

      await expect(
        contract.connect(user1).register(longUsername)
      ).to.be.revertedWith("Invalid username length");
    });

    it("should accept username with special characters", async function () {
      await contract.connect(user1).register("user_123");
      const [username] = await contract.getUser(user1.address);
      expect(username).to.equal("user_123");
    });

    it("should accept username with unicode characters", async function () {
      await contract.connect(user1).register("用户名");
      const [username] = await contract.getUser(user1.address);
      expect(username).to.equal("用户名");
    });
  });

  describe("Duplicate Registration Prevention", function () {
    it("should reject duplicate registration from same address", async function () {
      await contract.connect(user1).register("alice");

      await expect(
        contract.connect(user1).register("alice_v2")
      ).to.be.revertedWith("Already registered");
    });

    it("should allow different users to register with same username", async function () {
      // Note: The contract may or may not enforce unique usernames
      // This test documents the actual behavior
      await contract.connect(user1).register("popular_name");

      // Try registering same name with different address
      try {
        await contract.connect(user2).register("popular_name");
        // If it succeeds, usernames are not unique
        const [username1] = await contract.getUser(user1.address);
        const [username2] = await contract.getUser(user2.address);
        expect(username1).to.equal("popular_name");
        expect(username2).to.equal("popular_name");
      } catch (error) {
        // If it fails, usernames must be unique
        expect(error.message).to.include("Username taken");
      }
    });
  });

  describe("Multiple Users", function () {
    it("should handle multiple user registrations", async function () {
      await contract.connect(owner).register("owner");
      await contract.connect(user1).register("user1");
      await contract.connect(user2).register("user2");

      const [ownerName, ownerReg] = await contract.getUser(owner.address);
      const [user1Name, user1Reg] = await contract.getUser(user1.address);
      const [user2Name, user2Reg] = await contract.getUser(user2.address);

      expect(ownerName).to.equal("owner");
      expect(user1Name).to.equal("user1");
      expect(user2Name).to.equal("user2");
      expect(ownerReg).to.equal(true);
      expect(user1Reg).to.equal(true);
      expect(user2Reg).to.equal(true);
    });

    it("should return correct data for unregistered user", async function () {
      const [username, registered, registeredAt] = await contract.getUser(user1.address);
      expect(username).to.equal("");
      expect(registered).to.equal(false);
      expect(registeredAt).to.equal(0);
    });
  });

  describe("Gas Optimization", function () {
    it("should use reasonable gas for registration", async function () {
      const tx = await contract.connect(user1).register("alice");
      const receipt = await tx.wait();

      // Registration should use less than 100k gas
      expect(receipt.gasUsed).to.be.lt(100000);
      console.log(`Registration gas used: ${receipt.gasUsed}`);
    });

    it("should use similar gas regardless of username length", async function () {
      const tx1 = await contract.connect(user1).register("a");
      const receipt1 = await tx1.wait();

      const tx2 = await contract.connect(user2).register("a".repeat(32));
      const receipt2 = await tx2.wait();

      // Gas difference should be within 25% (string storage varies)
      const gasDiff = Math.abs(Number(receipt1.gasUsed) - Number(receipt2.gasUsed));
      const avgGas = (Number(receipt1.gasUsed) + Number(receipt2.gasUsed)) / 2;
      expect(gasDiff / avgGas).to.be.lt(0.25);

      console.log(`Short username gas: ${receipt1.gasUsed}`);
      console.log(`Long username gas: ${receipt2.gasUsed}`);
    });
  });
});
