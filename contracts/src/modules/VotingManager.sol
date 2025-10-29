// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VotingManager
 * @notice Manages FHE-encrypted voting for channels
 */
contract VotingManager is SepoliaConfig, Ownable {

    struct Vote {
        string question;          // Voting question (plaintext)
        string[] options;         // Vote options (plaintext)
        bool isMultiChoice;       // Single or multiple choice
        uint256 createdAt;
        bool active;
        mapping(uint8 => euint8) optionVotes;  // Encrypted vote count for each option
        mapping(address => bool) hasVoted;      // Track who voted
    }

    // channelId => Vote
    mapping(uint256 => Vote) public votes;

    // Authorization mapping
    mapping(address => bool) public authorized;

    event VoteCreated(uint256 indexed channelId, string question, uint8 optionCount);
    event VoteCast(uint256 indexed channelId, address indexed voter);
    event VoteClosed(uint256 indexed channelId);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    /**
     * @notice Create a vote for a channel
     */
    function createVote(
        uint256 channelId,
        string calldata question,
        string[] calldata options,
        bool isMultiChoice
    ) external onlyAuthorized {
        require(bytes(question).length > 0, "Empty question");
        require(options.length >= 2 && options.length <= 10, "2-10 options required");
        require(!votes[channelId].active, "Vote already exists");

        Vote storage v = votes[channelId];
        v.question = question;
        v.isMultiChoice = isMultiChoice;
        v.createdAt = block.timestamp;
        v.active = true;

        // Copy options array
        for (uint8 i = 0; i < options.length; i++) {
            v.options.push(options[i]);
        }

        // Initialize encrypted vote counts to 0
        for (uint8 i = 0; i < options.length; i++) {
            v.optionVotes[i] = FHE.asEuint8(0);
            FHE.allowThis(v.optionVotes[i]);
        }

        emit VoteCreated(channelId, question, uint8(options.length));
    }

    /**
     * @notice Cast encrypted vote
     */
    function castVote(
        uint256 channelId,
        externalEuint8 encryptedOption,
        bytes calldata proof
    ) external {
        Vote storage v = votes[channelId];
        require(v.active, "Vote not active");
        require(!v.hasVoted[msg.sender], "Already voted");

        // Import encrypted vote from frontend
        euint8 option = FHE.fromExternal(encryptedOption, proof);
        FHE.allowThis(option);

        // Update vote counts using FHE computation
        for (uint8 i = 0; i < v.options.length; i++) {
            // Check if this option was selected (encrypted comparison)
            euint8 isSelected = FHE.select(
                FHE.eq(option, FHE.asEuint8(i)),
                FHE.asEuint8(1),
                FHE.asEuint8(0)
            );

            // Add to option count
            v.optionVotes[i] = FHE.add(v.optionVotes[i], isSelected);
            FHE.allowThis(v.optionVotes[i]);
        }

        v.hasVoted[msg.sender] = true;
        emit VoteCast(channelId, msg.sender);
    }

    /**
     * @notice Close voting
     */
    function closeVote(uint256 channelId) external onlyAuthorized {
        require(votes[channelId].active, "Vote not active");
        votes[channelId].active = false;
        emit VoteClosed(channelId);
    }

    /**
     * @notice Get vote info (plaintext only)
     */
    function getVoteInfo(uint256 channelId) external view returns (
        string memory question,
        string[] memory options,
        bool isMultiChoice,
        bool active,
        uint256 createdAt
    ) {
        Vote storage v = votes[channelId];
        return (
            v.question,
            v.options,
            v.isMultiChoice,
            v.active,
            v.createdAt
        );
    }

    /**
     * @notice Get encrypted vote count for an option
     */
    function getOptionVotes(uint256 channelId, uint8 optionId) external view returns (euint8) {
        return votes[channelId].optionVotes[optionId];
    }

    /**
     * @notice Check if user has voted
     */
    function hasVoted(uint256 channelId, address user) external view returns (bool) {
        return votes[channelId].hasVoted[user];
    }

    /**
     * @notice Check if vote is active
     */
    function isVoteActive(uint256 channelId) external view returns (bool) {
        return votes[channelId].active;
    }
}
