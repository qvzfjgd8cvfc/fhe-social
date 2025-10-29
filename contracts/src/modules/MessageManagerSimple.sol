// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MessageManager (Simplified)
 * @notice Manages messages and replies WITHOUT encryption
 */
contract MessageManagerSimple is Ownable {

    struct Message {
        address author;           // Plaintext author address
        string content;           // Plaintext content
        uint256 timestamp;
        uint256 channelId;
        uint256 replyCount;
        bool exists;
    }

    struct Reply {
        address author;           // Plaintext author address
        string content;           // Plaintext content
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
    event MessagePosted(uint256 indexed channelId, uint256 indexed messageId, address indexed author);
    event ReplyPosted(uint256 indexed messageId, uint256 indexed replyId, address indexed author);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    function postMessage(
        uint256 channelId,
        string calldata content,
        address author
    ) external onlyAuthorized returns (uint256 messageId) {
        require(bytes(content).length > 0, "Empty content");

        messageId = messageCount++;

        messages[messageId] = Message({
            author: author,
            content: content,
            timestamp: block.timestamp,
            channelId: channelId,
            replyCount: 0,
            exists: true
        });

        // Add to channel messages
        channelMessages[channelId].push(messageId);

        emit MessagePosted(channelId, messageId, author);
    }

    function postReply(
        uint256 messageId,
        string calldata content,
        address author
    ) external onlyAuthorized returns (uint256 replyId) {
        require(messages[messageId].exists, "Message not found");
        require(bytes(content).length > 0, "Empty content");

        Reply memory newReply = Reply({
            author: author,
            content: content,
            timestamp: block.timestamp,
            messageId: messageId,
            exists: true
        });

        messageReplies[messageId].push(newReply);
        replyId = messageReplies[messageId].length - 1;

        // Increment reply count
        messages[messageId].replyCount++;

        emit ReplyPosted(messageId, replyId, author);
    }

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

    function getMessageAuthor(uint256 messageId) external view returns (address) {
        require(messages[messageId].exists, "Message not found");
        return messages[messageId].author;
    }

    function getReply(uint256 messageId, uint256 replyId) external view returns (
        string memory content,
        uint256 timestamp,
        bool exists
    ) {
        require(replyId < messageReplies[messageId].length, "Reply not found");

        Reply storage reply = messageReplies[messageId][replyId];
        return (
            reply.content,
            reply.timestamp,
            reply.exists
        );
    }

    function getReplyAuthor(uint256 messageId, uint256 replyId) external view returns (address) {
        require(replyId < messageReplies[messageId].length, "Reply not found");
        return messageReplies[messageId][replyId].author;
    }

    function getChannelMessages(uint256 channelId) external view returns (uint256[] memory) {
        return channelMessages[channelId];
    }

    function getMessageReplies(uint256 messageId) external view returns (uint256) {
        if (!messages[messageId].exists) {
            return 0;
        }
        return messages[messageId].replyCount;
    }

    function getAllReplies(uint256 messageId) external view returns (Reply[] memory) {
        return messageReplies[messageId];
    }

    function getMessageCount() external view returns (uint256) {
        return messageCount;
    }
}
