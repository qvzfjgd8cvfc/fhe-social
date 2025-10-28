// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title MessageManager
 * @notice Manages messages and replies with encrypted author addresses
 */
contract MessageManager is Ownable {

    struct Message {
        euint64 encryptedAuthor;    // Encrypted author address
        string content;               // Plaintext content
        uint256 timestamp;
        uint256 channelId;
        uint256 replyCount;
        bool exists;
    }

    struct Reply {
        euint64 encryptedAuthor;    // Encrypted author address
        string content;               // Plaintext content
        uint256 timestamp;
        uint256 messageId;
        bool exists;
    }

    // State variables
    uint256 public messageCount;
    mapping(uint256 => Message) private messages;
    mapping(uint256 => uint256[]) private channelMessages;  // channelId => messageIds
    mapping(uint256 => Reply[]) private messageReplies;     // messageId => replies

    // Authorization
    mapping(address => bool) public authorized;

    // Events
    event MessagePosted(uint256 indexed channelId, uint256 indexed messageId, uint256 timestamp);
    event ReplyPosted(uint256 indexed messageId, uint256 indexed replyId, uint256 timestamp);

    // Errors
    error Unauthorized();
    error MessageNotFound();
    error InvalidContent();
    error ChannelNotFound();

    // Modifiers
    modifier onlyAuthorized() {
        if (!authorized[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set authorization for a contract
     */
    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    /**
     * @notice Post a new message to a channel
     */
    function postMessage(
        uint256 channelId,
        string calldata content,
        euint64 encryptedAuthor
    ) external onlyAuthorized returns (uint256 messageId) {
        if (bytes(content).length == 0) {
            revert InvalidContent();
        }

        messageId = ++messageCount;

        // Allow contract to access encrypted author
        FHE.allowThis(encryptedAuthor);

        messages[messageId] = Message({
            encryptedAuthor: encryptedAuthor,
            content: content,
            timestamp: block.timestamp,
            channelId: channelId,
            replyCount: 0,
            exists: true
        });

        // Add to channel messages
        channelMessages[channelId].push(messageId);

        emit MessagePosted(channelId, messageId, block.timestamp);
    }

    /**
     * @notice Post a reply to a message
     */
    function postReply(
        uint256 messageId,
        string calldata content,
        euint64 encryptedAuthor
    ) external onlyAuthorized returns (uint256 replyId) {
        if (!messages[messageId].exists) {
            revert MessageNotFound();
        }
        if (bytes(content).length == 0) {
            revert InvalidContent();
        }

        // Allow contract to access encrypted author
        FHE.allowThis(encryptedAuthor);

        Reply memory newReply = Reply({
            encryptedAuthor: encryptedAuthor,
            content: content,
            timestamp: block.timestamp,
            messageId: messageId,
            exists: true
        });

        messageReplies[messageId].push(newReply);
        replyId = messageReplies[messageId].length - 1;

        // Increment reply count
        messages[messageId].replyCount++;

        emit ReplyPosted(messageId, replyId, block.timestamp);
    }

    /**
     * @notice Get message information
     */
    function getMessage(uint256 messageId) external view returns (
        string memory content,
        uint256 timestamp,
        uint256 channelId,
        uint256 replyCount,
        bool exists
    ) {
        Message storage message = messages[messageId];
        return (
            message.content,
            message.timestamp,
            message.channelId,
            message.replyCount,
            message.exists
        );
    }

    /**
     * @notice Get encrypted author of a message
     */
    function getMessageAuthor(uint256 messageId) external view returns (euint64) {
        if (!messages[messageId].exists) {
            revert MessageNotFound();
        }
        return messages[messageId].encryptedAuthor;
    }

    /**
     * @notice Get reply information
     */
    function getReply(uint256 messageId, uint256 replyId) external view returns (
        string memory content,
        uint256 timestamp,
        bool exists
    ) {
        if (replyId >= messageReplies[messageId].length) {
            revert MessageNotFound();
        }

        Reply storage reply = messageReplies[messageId][replyId];
        return (
            reply.content,
            reply.timestamp,
            reply.exists
        );
    }

    /**
     * @notice Get encrypted author of a reply
     */
    function getReplyAuthor(uint256 messageId, uint256 replyId) external view returns (euint64) {
        if (replyId >= messageReplies[messageId].length) {
            revert MessageNotFound();
        }
        return messageReplies[messageId][replyId].encryptedAuthor;
    }

    /**
     * @notice Get all message IDs for a channel
     */
    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory) {
        return channelMessages[channelId];
    }

    /**
     * @notice Get reply count for a message
     */
    function getMessageReplies(uint256 messageId) external view returns (uint256) {
        if (!messages[messageId].exists) {
            return 0;
        }
        return messages[messageId].replyCount;
    }

    /**
     * @notice Get all replies for a message
     */
    function getAllReplies(uint256 messageId) external view returns (Reply[] memory) {
        return messageReplies[messageId];
    }

    /**
     * @notice Get total message count
     */
    function getMessageCount() external view returns (uint256) {
        return messageCount;
    }
}
