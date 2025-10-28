// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, euint64, externalEuint160} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title UserRegistry
 * @notice Manages user profiles with encrypted addresses
 */
contract UserRegistry is SepoliaConfig, Ownable {

    struct UserProfile {
        string username;
        euint64 encryptedAddress;
        uint256 registeredAt;
        uint256 messageCount;
        uint256 channelCount;
        bool exists;
    }

    // State variables
    mapping(address => UserProfile) private userProfiles;
    mapping(string => address) private usernameToAddress;
    uint256 public userCount;

    // Authorization
    mapping(address => bool) public authorized;

    // Events
    event UserRegistered(address indexed user, string username, uint256 timestamp);
    event UsernameUpdated(address indexed user, string oldUsername, string newUsername);
    event ProfileUpdated(address indexed user);

    // Errors
    error Unauthorized();
    error UserAlreadyRegistered();
    error UserNotRegistered();
    error UsernameTaken();
    error InvalidUsername();

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
     * @notice Register a new user
     */
    function registerUser(
        address user,
        string calldata username
    ) external onlyAuthorized {
        if (userProfiles[user].exists) {
            revert UserAlreadyRegistered();
        }
        if (bytes(username).length == 0) {
            revert InvalidUsername();
        }
        if (usernameToAddress[username] != address(0)) {
            revert UsernameTaken();
        }

        // Convert external encrypted address
        euint64 encryptedAddress = FHE.asEuint64(uint64(uint160(user)));
        FHE.allowThis(encryptedAddress);

        userProfiles[user] = UserProfile({
            username: username,
            encryptedAddress: encryptedAddress,
            registeredAt: block.timestamp,
            messageCount: 0,
            channelCount: 0,
            exists: true
        });

        usernameToAddress[username] = user;
        userCount++;

        emit UserRegistered(user, username, block.timestamp);
    }

    /**
     * @notice Update username
     */
    function updateUsername(address user, string calldata newUsername) external onlyAuthorized {
        if (!userProfiles[user].exists) {
            revert UserNotRegistered();
        }
        if (bytes(newUsername).length == 0) {
            revert InvalidUsername();
        }
        if (usernameToAddress[newUsername] != address(0)) {
            revert UsernameTaken();
        }

        string memory oldUsername = userProfiles[user].username;

        // Remove old username mapping
        delete usernameToAddress[oldUsername];

        // Update to new username
        userProfiles[user].username = newUsername;
        usernameToAddress[newUsername] = user;

        emit UsernameUpdated(user, oldUsername, newUsername);
    }

    /**
     * @notice Increment message count for a user
     */
    function incrementMessageCount(address user) external onlyAuthorized {
        if (!userProfiles[user].exists) {
            revert UserNotRegistered();
        }
        userProfiles[user].messageCount++;
    }

    /**
     * @notice Increment channel count for a user
     */
    function incrementChannelCount(address user) external onlyAuthorized {
        if (!userProfiles[user].exists) {
            revert UserNotRegistered();
        }
        userProfiles[user].channelCount++;
    }

    /**
     * @notice Get user profile information
     */
    function getUserProfile(address user) external view returns (
        string memory username,
        uint256 registeredAt,
        uint256 messageCount,
        uint256 channelCount,
        bool exists
    ) {
        UserProfile storage profile = userProfiles[user];
        return (
            profile.username,
            profile.registeredAt,
            profile.messageCount,
            profile.channelCount,
            profile.exists
        );
    }

    /**
     * @notice Get encrypted address for a user
     */
    function getEncryptedAddress(address user) external view returns (euint64) {
        if (!userProfiles[user].exists) {
            revert UserNotRegistered();
        }
        return userProfiles[user].encryptedAddress;
    }

    /**
     * @notice Check if user is registered
     */
    function isUserRegistered(address user) external view returns (bool) {
        return userProfiles[user].exists;
    }

    /**
     * @notice Get username for a user
     */
    function getUsername(address user) external view returns (string memory) {
        if (!userProfiles[user].exists) {
            return "";
        }
        return userProfiles[user].username;
    }

    /**
     * @notice Get address by username
     */
    function getAddressByUsername(string calldata username) external view returns (address) {
        return usernameToAddress[username];
    }

    /**
     * @notice Get total user count
     */
    function getUserCount() external view returns (uint256) {
        return userCount;
    }
}
