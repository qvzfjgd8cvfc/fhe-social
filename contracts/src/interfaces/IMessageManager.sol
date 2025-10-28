// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IMessageManager
 * @notice Interface for managing messages and replies with encrypted author addresses
 */
interface IMessageManager {

    struct Message {
        euint64 encryptedAuthor;    // Encrypted author address
        string content;               // Plaintext message content
        uint256 timestamp;
        uint256 channelId;
        uint256 replyCount;
        bool exists;
    }

    struct Reply {
        euint64 encryptedAuthor;    // Encrypted author address
        string content;               // Plaintext reply content
        uint256 timestamp;
        uint256 messageId;
        bool exists;
    }

    // Events
    event MessagePosted(uint256 indexed channelId, uint256 indexed messageId, uint256 timestamp);
    event ReplyPosted(uint256 indexed messageId, uint256 indexed replyId, uint256 timestamp);

    // Message management
    function postMessage(
        uint256 channelId,
        string calldata content,
        euint64 encryptedAuthor
    ) external returns (uint256 messageId);

    function postReply(
        uint256 messageId,
        string calldata content,
        euint64 encryptedAuthor
    ) external returns (uint256 replyId);

    // View functions
    function getMessage(uint256 messageId) external view returns (Message memory);
    function getReply(uint256 messageId, uint256 replyId) external view returns (Reply memory);
    function getMessageCount() external view returns (uint256);
    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory);
    function getMessageReplies(uint256 messageId) external view returns (uint256 count);
}
