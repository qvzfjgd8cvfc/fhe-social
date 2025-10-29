// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Import module interfaces
interface IChannelManagerSimple {
    function createChannel(string calldata name, string calldata description, address creator) external returns (uint256);
    function updateChannel(uint256 channelId, string calldata name, string calldata description) external;
    function incrementMessageCount(uint256 channelId) external;
    function getChannel(uint256 channelId) external view returns (string memory, string memory, address, uint256, uint256, bool);
    function channelExists(uint256 channelId) external view returns (bool);
    function getChannelCount() external view returns (uint256);
}

interface IMessageManagerSimple {
    function postMessage(uint256 channelId, string calldata content, address author) external returns (uint256);
    function postReply(uint256 messageId, string calldata content, address author) external returns (uint256);
    function getMessage(uint256 messageId) external view returns (string memory, uint256, uint256, uint256, bool);
    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory);
    function getMessageCount() external view returns (uint256);
}

interface IUserRegistry {
    function registerUser(address user, string calldata username) external;
    function incrementMessageCount(address user) external;
    function incrementChannelCount(address user) external;
    function getUserProfile(address user) external view returns (string memory, uint256, uint256, uint256, bool);
    function isUserRegistered(address user) external view returns (bool);
    function getUserCount() external view returns (uint256);
}

interface IVotingManager {
    function createVote(uint256 channelId, string calldata question, string[] calldata options, bool isMultiChoice) external;
    function castVote(uint256 channelId, externalEuint8 encryptedOption, bytes calldata proof) external;
    function closeVote(uint256 channelId) external;
    function getVoteInfo(uint256 channelId) external view returns (string memory, string[] memory, bool, bool, uint256);
    function hasVoted(uint256 channelId, address user) external view returns (bool);
    function isVoteActive(uint256 channelId) external view returns (bool);
}

/**
 * @title FHESocialVoting
 * @notice Social platform with encrypted voting
 */
contract FHESocialVoting is SepoliaConfig, Ownable, ReentrancyGuard {

    // Module references
    IChannelManagerSimple public channelManager;
    IMessageManagerSimple public messageManager;
    IUserRegistry public userRegistry;
    IVotingManager public votingManager;

    // Events
    event ChannelCreated(uint256 indexed channelId, string name, address indexed creator);
    event MessagePosted(uint256 indexed channelId, uint256 indexed messageId, address indexed author);
    event UserRegistered(address indexed user, string username);
    event VoteCreated(uint256 indexed channelId, string question);
    event VoteCast(uint256 indexed channelId, address indexed voter);

    // Errors
    error UserNotRegistered();
    error ChannelNotFound();
    error InvalidInput();

    constructor(
        address _channelManager,
        address _messageManager,
        address _userRegistry,
        address _votingManager
    ) Ownable(msg.sender) {
        channelManager = IChannelManagerSimple(_channelManager);
        messageManager = IMessageManagerSimple(_messageManager);
        userRegistry = IUserRegistry(_userRegistry);
        votingManager = IVotingManager(_votingManager);
    }

    /**
     * @notice Register a new user
     */
    function registerUser(string calldata username) external nonReentrant {
        userRegistry.registerUser(msg.sender, username);
        emit UserRegistered(msg.sender, username);
    }

    /**
     * @notice Create a channel with voting
     */
    function createChannelWithVote(
        string calldata name,
        string calldata description,
        string calldata voteQuestion,
        string[] calldata voteOptions,
        bool isMultiChoice
    ) external nonReentrant returns (uint256 channelId) {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        if (bytes(name).length == 0 || bytes(voteQuestion).length == 0) {
            revert InvalidInput();
        }

        // Create channel
        channelId = channelManager.createChannel(name, description, msg.sender);
        userRegistry.incrementChannelCount(msg.sender);

        // Create vote for this channel
        votingManager.createVote(channelId, voteQuestion, voteOptions, isMultiChoice);

        emit ChannelCreated(channelId, name, msg.sender);
        emit VoteCreated(channelId, voteQuestion);
    }

    /**
     * @notice Post a message to a channel
     */
    function postMessage(
        uint256 channelId,
        string calldata content
    ) external nonReentrant returns (uint256 messageId) {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        if (!channelManager.channelExists(channelId)) {
            revert ChannelNotFound();
        }
        if (bytes(content).length == 0) {
            revert InvalidInput();
        }

        messageId = messageManager.postMessage(channelId, content, msg.sender);
        channelManager.incrementMessageCount(channelId);
        userRegistry.incrementMessageCount(msg.sender);

        emit MessagePosted(channelId, messageId, msg.sender);
    }

    /**
     * @notice Cast encrypted vote
     */
    function vote(
        uint256 channelId,
        externalEuint8 encryptedOption,
        bytes calldata proof
    ) external nonReentrant {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        if (!channelManager.channelExists(channelId)) {
            revert ChannelNotFound();
        }

        votingManager.castVote(channelId, encryptedOption, proof);
        emit VoteCast(channelId, msg.sender);
    }

    // View functions
    function getChannel(uint256 channelId) external view returns (
        string memory name,
        string memory description,
        address creator,
        uint256 createdAt,
        uint256 messageCount,
        bool exists
    ) {
        return channelManager.getChannel(channelId);
    }

    function getVoteInfo(uint256 channelId) external view returns (
        string memory question,
        string[] memory options,
        bool isMultiChoice,
        bool active,
        uint256 createdAt
    ) {
        return votingManager.getVoteInfo(channelId);
    }

    function hasVoted(uint256 channelId, address user) external view returns (bool) {
        return votingManager.hasVoted(channelId, user);
    }

    function getUserProfile(address user) external view returns (
        string memory username,
        uint256 registeredAt,
        uint256 messageCount,
        uint256 channelCount,
        bool exists
    ) {
        return userRegistry.getUserProfile(user);
    }

    function getStats() external view returns (
        uint256 totalUsers,
        uint256 totalChannels,
        uint256 totalMessages
    ) {
        return (
            userRegistry.getUserCount(),
            channelManager.getChannelCount(),
            messageManager.getMessageCount()
        );
    }

    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory) {
        return messageManager.getChannelMessages(channelId);
    }

    function getMessage(uint256 messageId) external view returns (
        string memory content,
        uint256 timestamp,
        uint256 channelId,
        uint256 replyCount,
        bool exists
    ) {
        return messageManager.getMessage(messageId);
    }
}
