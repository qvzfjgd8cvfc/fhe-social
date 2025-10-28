// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ChannelManager
 * @notice Manages chat channels with encrypted creator addresses
 * @dev Uses euint64 to store hashed creator addresses for FHE encryption
 */
contract ChannelManager is Ownable {

    struct Channel {
        string name;
        string description;
        euint64 encryptedCreator;   // Encrypted address hash (64 bits)
        uint256 createdAt;
        uint256 messageCount;
        bool exists;
    }

    // State variables
    uint256 public channelCount;
    mapping(uint256 => Channel) private channels;

    // Authorization
    mapping(address => bool) public authorized;

    // Events
    event ChannelCreated(uint256 indexed channelId, string name, uint256 timestamp);
    event ChannelUpdated(uint256 indexed channelId, string name, string description);
    event MessageCountIncremented(uint256 indexed channelId, uint256 newCount);

    // Errors
    error Unauthorized();
    error ChannelNotFound();
    error ChannelAlreadyExists();
    error InvalidChannelName();

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
     * @notice Create a new channel
     */
    function createChannel(
        string calldata name,
        string calldata description,
        euint64 encryptedCreator
    ) external onlyAuthorized returns (uint256 channelId) {
        if (bytes(name).length == 0) {
            revert InvalidChannelName();
        }

        channelId = ++channelCount;

        // Allow contract to access encrypted creator
        FHE.allowThis(encryptedCreator);

        channels[channelId] = Channel({
            name: name,
            description: description,
            encryptedCreator: encryptedCreator,
            createdAt: block.timestamp,
            messageCount: 0,
            exists: true
        });

        emit ChannelCreated(channelId, name, block.timestamp);
    }

    /**
     * @notice Update channel information
     */
    function updateChannel(
        uint256 channelId,
        string calldata name,
        string calldata description
    ) external onlyAuthorized {
        if (!channels[channelId].exists) {
            revert ChannelNotFound();
        }

        if (bytes(name).length > 0) {
            channels[channelId].name = name;
        }
        channels[channelId].description = description;

        emit ChannelUpdated(channelId, name, description);
    }

    /**
     * @notice Increment message count for a channel
     */
    function incrementMessageCount(uint256 channelId) external onlyAuthorized {
        if (!channels[channelId].exists) {
            revert ChannelNotFound();
        }

        channels[channelId].messageCount++;
        emit MessageCountIncremented(channelId, channels[channelId].messageCount);
    }

    /**
     * @notice Get channel information
     */
    function getChannel(uint256 channelId) external view returns (
        string memory name,
        string memory description,
        uint256 createdAt,
        uint256 messageCount,
        bool exists
    ) {
        Channel storage channel = channels[channelId];
        return (
            channel.name,
            channel.description,
            channel.createdAt,
            channel.messageCount,
            channel.exists
        );
    }

    /**
     * @notice Get encrypted creator address
     */
    function getChannelCreator(uint256 channelId) external view returns (euint64) {
        if (!channels[channelId].exists) {
            revert ChannelNotFound();
        }
        return channels[channelId].encryptedCreator;
    }

    /**
     * @notice Check if channel exists
     */
    function channelExists(uint256 channelId) external view returns (bool) {
        return channels[channelId].exists;
    }

    /**
     * @notice Get total channel count
     */
    function getChannelCount() external view returns (uint256) {
        return channelCount;
    }
}
