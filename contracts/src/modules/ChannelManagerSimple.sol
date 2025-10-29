// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChannelManager (Simplified)
 * @notice Manages discussion channels WITHOUT encryption
 */
contract ChannelManagerSimple is Ownable {

    struct Channel {
        string name;
        string description;
        address creator;  // Plaintext creator address
        uint256 createdAt;
        uint256 messageCount;
        bool exists;
    }

    mapping(uint256 => Channel) private channels;
    uint256 public channelCount;

    // Authorization mapping
    mapping(address => bool) public authorized;

    event ChannelCreated(uint256 indexed channelId, string name, address indexed creator);
    event ChannelUpdated(uint256 indexed channelId, string name);
    event MessageCountIncremented(uint256 indexed channelId, uint256 newCount);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    function createChannel(
        string calldata name,
        string calldata description,
        address creator
    ) external onlyAuthorized returns (uint256) {
        uint256 channelId = channelCount++;

        channels[channelId] = Channel({
            name: name,
            description: description,
            creator: creator,
            createdAt: block.timestamp,
            messageCount: 0,
            exists: true
        });

        emit ChannelCreated(channelId, name, creator);
        return channelId;
    }

    function updateChannel(
        uint256 channelId,
        string calldata name,
        string calldata description
    ) external onlyAuthorized {
        require(channels[channelId].exists, "Channel not found");

        channels[channelId].name = name;
        channels[channelId].description = description;

        emit ChannelUpdated(channelId, name);
    }

    function incrementMessageCount(uint256 channelId) external onlyAuthorized {
        require(channels[channelId].exists, "Channel not found");
        channels[channelId].messageCount++;
        emit MessageCountIncremented(channelId, channels[channelId].messageCount);
    }

    function getChannel(uint256 channelId) external view returns (
        string memory name,
        string memory description,
        address creator,
        uint256 createdAt,
        uint256 messageCount,
        bool exists
    ) {
        Channel storage channel = channels[channelId];
        return (
            channel.name,
            channel.description,
            channel.creator,
            channel.createdAt,
            channel.messageCount,
            channel.exists
        );
    }

    function getChannelCreator(uint256 channelId) external view returns (address) {
        return channels[channelId].creator;
    }

    function channelExists(uint256 channelId) external view returns (bool) {
        return channels[channelId].exists;
    }

    function getChannelCount() external view returns (uint256) {
        return channelCount;
    }
}
