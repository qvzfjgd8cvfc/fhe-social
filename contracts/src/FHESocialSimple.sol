// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Import module interfaces
interface IChannelManagerSimple {
    function createChannel(string calldata name, string calldata description, address creator) external returns (uint256);
    function updateChannel(uint256 channelId, string calldata name, string calldata description) external;
    function incrementMessageCount(uint256 channelId) external;
    function getChannel(uint256 channelId) external view returns (string memory, string memory, address, uint256, uint256, bool);
    function getChannelCreator(uint256 channelId) external view returns (address);
    function channelExists(uint256 channelId) external view returns (bool);
    function getChannelCount() external view returns (uint256);
}

interface IMessageManagerSimple {
    function postMessage(uint256 channelId, string calldata content, address author) external returns (uint256);
    function postReply(uint256 messageId, string calldata content, address author) external returns (uint256);
    function getMessage(uint256 messageId) external view returns (string memory, uint256, uint256, uint256, bool);
    function getMessageAuthor(uint256 messageId) external view returns (address);
    function getReply(uint256 messageId, uint256 replyId) external view returns (string memory, uint256, bool);
    function getReplyAuthor(uint256 messageId, uint256 replyId) external view returns (address);
    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory);
    function getMessageReplies(uint256 messageId) external view returns (uint256);
    function getMessageCount() external view returns (uint256);
}

interface IUserRegistry {
    function registerUser(address user, string calldata username) external;
    function updateUsername(address user, string calldata newUsername) external;
    function incrementMessageCount(address user) external;
    function incrementChannelCount(address user) external;
    function getUserProfile(address user) external view returns (string memory, uint256, uint256, uint256, bool);
    function isUserRegistered(address user) external view returns (bool);
    function getUsername(address user) external view returns (string memory);
    function getUserCount() external view returns (uint256);
}

/**
 * @title FHESocialSimple
 * @notice Simplified social platform without FHE encryption
 */
contract FHESocialSimple is Ownable, ReentrancyGuard {

    // Module references
    IChannelManagerSimple public channelManager;
    IMessageManagerSimple public messageManager;
    IUserRegistry public userRegistry;

    // Events
    event ChannelCreated(uint256 indexed channelId, string name, address indexed creator);
    event MessagePosted(uint256 indexed channelId, uint256 indexed messageId, address indexed author);
    event ReplyPosted(uint256 indexed messageId, uint256 indexed replyId, address indexed author);
    event UserRegistered(address indexed user, string username);

    // Errors
    error UserNotRegistered();
    error ChannelNotFound();
    error MessageNotFound();
    error InvalidInput();

    constructor(
        address _channelManager,
        address _messageManager,
        address _userRegistry
    ) Ownable(msg.sender) {
        channelManager = IChannelManagerSimple(_channelManager);
        messageManager = IMessageManagerSimple(_messageManager);
        userRegistry = IUserRegistry(_userRegistry);
    }

    /**
     * @notice Register a new user
     */
    function registerUser(string calldata username) external nonReentrant {
        userRegistry.registerUser(msg.sender, username);
        emit UserRegistered(msg.sender, username);
    }

    /**
     * @notice Update username
     */
    function updateUsername(string calldata newUsername) external {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        userRegistry.updateUsername(msg.sender, newUsername);
    }

    /**
     * @notice Create a new channel
     */
    function createChannel(
        string calldata name,
        string calldata description
    ) external nonReentrant returns (uint256 channelId) {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        if (bytes(name).length == 0) {
            revert InvalidInput();
        }

        channelId = channelManager.createChannel(name, description, msg.sender);
        userRegistry.incrementChannelCount(msg.sender);

        emit ChannelCreated(channelId, name, msg.sender);
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
     * @notice Post a reply to a message
     */
    function postReply(
        uint256 messageId,
        string calldata content
    ) external nonReentrant returns (uint256 replyId) {
        if (!userRegistry.isUserRegistered(msg.sender)) {
            revert UserNotRegistered();
        }
        if (bytes(content).length == 0) {
            revert InvalidInput();
        }

        replyId = messageManager.postReply(messageId, content, msg.sender);
        userRegistry.incrementMessageCount(msg.sender);

        emit ReplyPosted(messageId, replyId, msg.sender);
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

    function getChannelCreator(uint256 channelId) external view returns (address) {
        return channelManager.getChannelCreator(channelId);
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

    function getMessageAuthor(uint256 messageId) external view returns (address) {
        return messageManager.getMessageAuthor(messageId);
    }

    function getReply(uint256 messageId, uint256 replyId) external view returns (
        string memory content,
        uint256 timestamp,
        bool exists
    ) {
        return messageManager.getReply(messageId, replyId);
    }

    function getReplyAuthor(uint256 messageId, uint256 replyId) external view returns (address) {
        return messageManager.getReplyAuthor(messageId, replyId);
    }

    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory) {
        return messageManager.getChannelMessages(channelId);
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
}
