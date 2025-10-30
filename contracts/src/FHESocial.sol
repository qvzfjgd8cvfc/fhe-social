// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHESocial
 * @notice Privacy-preserving social platform with encrypted voting
 * Features:
 * 1. User registration (plaintext)
 * 2. Create channels and voting polls (plaintext)
 * 3. Encrypted voting using FHE
 * 4. Anonymous or public messages (plaintext)
 */
contract FHESocial is SepoliaConfig {
    // ============ State Variables ============

    struct User {
        string username;
        bool registered;
        uint256 registeredAt;
    }

    struct Channel {
        string name;
        string description;
        address creator;
        uint256 createdAt;
        bool active;
    }

    struct Message {
        address sender;
        string content;
        bool isAnonymous;
        uint256 timestamp;
    }

    struct Vote {
        string question;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool active;
        mapping(address => euint8) userVotes; // Store each user's encrypted vote (0-9)
        mapping(address => bool) hasVoted;
    }

    // ============ Storage ============

    mapping(address => User) public users;
    mapping(uint256 => Channel) public channels;
    mapping(uint256 => Message[]) public channelMessages;
    mapping(uint256 => Vote) public channelVotes;

    uint256 public channelCount;

    // ============ Events ============

    event UserRegistered(address indexed user, string username);
    event ChannelCreated(uint256 indexed channelId, string name, address creator);
    event MessagePosted(uint256 indexed channelId, address indexed sender, bool isAnonymous);
    event VoteCreated(uint256 indexed channelId, string question);
    event VoteCast(uint256 indexed channelId, address indexed voter);

    // ============ Modifiers ============

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Not registered");
        _;
    }

    // ============ User Functions ============

    /**
     * @notice Register a new user (plaintext)
     * @param _username Username for the user
     */
    function register(string calldata _username) external {
        require(!users[msg.sender].registered, "Already registered");
        require(bytes(_username).length > 0 && bytes(_username).length <= 32, "Invalid username length");

        users[msg.sender] = User({
            username: _username,
            registered: true,
            registeredAt: block.timestamp
        });

        emit UserRegistered(msg.sender, _username);
    }

    /**
     * @notice Get user information
     * @param _user Address of the user
     */
    function getUser(address _user) external view returns (string memory username, bool registered, uint256 registeredAt) {
        User memory user = users[_user];
        return (user.username, user.registered, user.registeredAt);
    }

    // ============ Channel Functions ============

    /**
     * @notice Create a new channel (plaintext)
     * @param _name Channel name
     * @param _description Channel description
     */
    function createChannel(string calldata _name, string calldata _description) external onlyRegistered returns (uint256) {
        require(bytes(_name).length > 0 && bytes(_name).length <= 64, "Invalid name length");

        uint256 channelId = channelCount++;

        channels[channelId] = Channel({
            name: _name,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        emit ChannelCreated(channelId, _name, msg.sender);
        return channelId;
    }

    /**
     * @notice Create a channel with voting in one transaction
     * @param _name Channel name
     * @param _description Channel description
     * @param _voteQuestion Vote question
     * @param _voteOptions Vote options
     * @param _voteDuration Vote duration in seconds
     */
    function createChannelWithVote(
        string calldata _name,
        string calldata _description,
        string calldata _voteQuestion,
        string[] calldata _voteOptions,
        uint256 _voteDuration
    ) external onlyRegistered returns (uint256) {
        require(bytes(_name).length > 0 && bytes(_name).length <= 64, "Invalid name length");
        require(_voteOptions.length >= 2 && _voteOptions.length <= 10, "Invalid options count");
        require(_voteDuration >= 3600 && _voteDuration <= 7776000, "Invalid duration"); // 1 hour to 90 days

        // Create channel
        uint256 channelId = channelCount++;

        channels[channelId] = Channel({
            name: _name,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        emit ChannelCreated(channelId, _name, msg.sender);

        // Create vote for this channel
        Vote storage vote = channelVotes[channelId];
        vote.question = _voteQuestion;
        vote.options = _voteOptions;
        vote.startTime = block.timestamp;
        vote.endTime = block.timestamp + _voteDuration;
        vote.active = true;

        // Don't initialize FHE values here - they will be lazy-initialized on first vote

        emit VoteCreated(channelId, _voteQuestion);

        return channelId;
    }

    /**
     * @notice Get channel information
     * @param _channelId Channel ID
     */
    function getChannel(uint256 _channelId) external view returns (
        string memory name,
        string memory description,
        address creator,
        uint256 createdAt,
        bool active
    ) {
        require(_channelId < channelCount, "Invalid channel");
        Channel memory channel = channels[_channelId];
        return (channel.name, channel.description, channel.creator, channel.createdAt, channel.active);
    }

    // ============ Message Functions ============

    /**
     * @notice Post a message in a channel (plaintext, can be anonymous)
     * @param _channelId Channel to post in
     * @param _content Message content
     * @param isAnonymous Whether to post anonymously
     */
    function postMessage(uint256 _channelId, string calldata _content, bool isAnonymous) external onlyRegistered {
        require(_channelId < channelCount, "Invalid channel");
        require(channels[_channelId].active, "Channel inactive");
        require(bytes(_content).length > 0 && bytes(_content).length <= 1000, "Invalid content length");

        channelMessages[_channelId].push(Message({
            sender: isAnonymous ? address(0) : msg.sender,
            content: _content,
            isAnonymous: isAnonymous,
            timestamp: block.timestamp
        }));

        emit MessagePosted(_channelId, msg.sender, isAnonymous);
    }

    /**
     * @notice Get messages from a channel
     * @param _channelId Channel ID
     * @param _offset Starting index
     * @param _limit Number of messages to return
     */
    function getMessages(uint256 _channelId, uint256 _offset, uint256 _limit) external view returns (
        address[] memory senders,
        string[] memory contents,
        bool[] memory isAnonymousFlags,
        uint256[] memory timestamps
    ) {
        require(_channelId < channelCount, "Invalid channel");

        Message[] storage msgs = channelMessages[_channelId];
        uint256 totalMsgs = msgs.length;

        if (_offset >= totalMsgs) {
            return (new address[](0), new string[](0), new bool[](0), new uint256[](0));
        }

        uint256 end = _offset + _limit;
        if (end > totalMsgs) {
            end = totalMsgs;
        }
        uint256 count = end - _offset;

        senders = new address[](count);
        contents = new string[](count);
        isAnonymousFlags = new bool[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            Message storage msg = msgs[_offset + i];
            senders[i] = msg.sender;
            contents[i] = msg.content;
            isAnonymousFlags[i] = msg.isAnonymous;
            timestamps[i] = msg.timestamp;
        }

        return (senders, contents, isAnonymousFlags, timestamps);
    }

    // ============ Voting Functions ============

    /**
     * @notice Create a voting poll in a channel (plaintext)
     * @param _channelId Channel ID
     * @param _question Vote question
     * @param _options Vote options
     * @param _duration Duration in seconds
     */
    function createVote(
        uint256 _channelId,
        string calldata _question,
        string[] calldata _options,
        uint256 _duration
    ) external onlyRegistered {
        require(_channelId < channelCount, "Invalid channel");
        require(channels[_channelId].creator == msg.sender, "Only creator can create votes");
        require(!channelVotes[_channelId].active, "Vote already active");
        require(_options.length >= 2 && _options.length <= 10, "Invalid options count");
        require(_duration >= 3600 && _duration <= 7776000, "Invalid duration"); // 1 hour to 90 days

        Vote storage vote = channelVotes[_channelId];
        vote.question = _question;
        vote.options = _options;
        vote.startTime = block.timestamp;
        vote.endTime = block.timestamp + _duration;
        vote.active = true;

        // Don't initialize FHE values here - they will be lazy-initialized on first vote

        emit VoteCreated(_channelId, _question);
    }

    /**
     * @notice Cast an encrypted vote
     * @param _channelId Channel ID
     * @param _encryptedOption Encrypted option index (0-9, encrypted as euint8)
     * @param _inputProof Input proof for FHE
     */
    function castVote(
        uint256 _channelId,
        externalEuint8 _encryptedOption,
        bytes calldata _inputProof
    ) external onlyRegistered {
        require(_channelId < channelCount, "Invalid channel");

        Vote storage v = channelVotes[_channelId];
        require(v.active, "Vote not active");
        require(block.timestamp < v.endTime, "Vote ended");
        require(!v.hasVoted[msg.sender], "Already voted");

        // Store the encrypted vote directly - NO LOOP!
        euint8 encryptedOptionIndex = FHE.fromExternal(_encryptedOption, _inputProof);
        v.userVotes[msg.sender] = encryptedOptionIndex;

        // Allow this contract to use this encrypted value
        FHE.allowThis(v.userVotes[msg.sender]);

        v.hasVoted[msg.sender] = true;

        emit VoteCast(_channelId, msg.sender);
    }

    /**
     * @notice Get vote information
     * @param _channelId Channel ID
     */
    function getVoteInfo(uint256 _channelId) external view returns (
        string memory question,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        bool active
    ) {
        require(_channelId < channelCount, "Invalid channel");
        Vote storage vote = channelVotes[_channelId];
        return (vote.question, vote.options, vote.startTime, vote.endTime, vote.active);
    }

    /**
     * @notice Check if user has voted
     * @param _channelId Channel ID
     * @param _user User address
     */
    function hasVoted(uint256 _channelId, address _user) external view returns (bool) {
        require(_channelId < channelCount, "Invalid channel");
        return channelVotes[_channelId].hasVoted[_user];
    }

    /**
     * @notice End a vote (can only be called by channel creator or after endTime)
     * @param _channelId Channel ID
     */
    function endVote(uint256 _channelId) external {
        require(_channelId < channelCount, "Invalid channel");
        Vote storage vote = channelVotes[_channelId];
        require(vote.active, "Vote not active");
        require(
            msg.sender == channels[_channelId].creator || block.timestamp >= vote.endTime,
            "Cannot end vote yet"
        );

        vote.active = false;
    }
}
