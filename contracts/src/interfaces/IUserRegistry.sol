// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IUserRegistry
 * @notice Interface for user registration and encrypted address management
 */
interface IUserRegistry {

    struct UserProfile {
        string username;
        euint64 encryptedAddress;
        uint256 registeredAt;
        uint256 messageCount;
        uint256 channelCount;
        bool exists;
    }

    // Events
    event UserRegistered(address indexed user, string username, uint256 timestamp);
    event UsernameUpdated(address indexed user, string oldUsername, string newUsername);

    // User management
    function registerUser(
        address user,
        string calldata username
    ) external;

    function updateUsername(address user, string calldata newUsername) external;

    function incrementMessageCount(address user) external;

    function incrementChannelCount(address user) external;

    // View functions
    function getUserProfile(address user) external view returns (UserProfile memory);
    function isUserRegistered(address user) external view returns (bool);
    function getUsername(address user) external view returns (string memory);
    function getEncryptedAddress(address user) external view returns (euint64);
    function getUserCount() external view returns (uint256);
}
