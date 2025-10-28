// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IChannelManager
 * @notice Interface for managing chat channels with encrypted creator addresses
 */
interface IChannelManager {

    struct Channel {
        string name;                 // Plaintext channel name
        string description;          // Plaintext description
        euint64 encryptedCreator;   // Encrypted creator address
        uint256 createdAt;
        uint256 messageCount;
        bool exists;
    }

    // Events
    event ChannelCreated(uint256 indexed channelId, string name, uint256 timestamp);
    event ChannelUpdated(uint256 indexed channelId, string name, string description);

    // Channel management
    function createChannel(
        string calldata name,
        string calldata description,
        euint64 encryptedCreator
    ) external returns (uint256 channelId);

    function updateChannel(
        uint256 channelId,
        string calldata name,
        string calldata description
    ) external;

    function incrementMessageCount(uint256 channelId) external;

    // View functions
    function getChannel(uint256 channelId) external view returns (Channel memory);
    function getChannelCount() external view returns (uint256);
    function channelExists(uint256 channelId) external view returns (bool);
    function getChannelCreator(uint256 channelId) external view returns (euint64);
}
