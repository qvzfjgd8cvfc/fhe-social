import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/constants';

export function useFHESocial() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // ============= User Functions =============

  /**
   * Register a new user
   */
  const registerUser = async (username: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'registerUser',
      args: [username],
    });
  };

  /**
   * Update username
   */
  const updateUsername = async (newUsername: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'updateUsername',
      args: [newUsername],
    });
  };

  // ============= Channel Functions =============

  /**
   * Create a channel with voting (NEW)
   */
  const createChannelWithVote = async (
    name: string,
    description: string,
    voteQuestion: string,
    voteOptions: string[],
    isMultiChoice: boolean
  ) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'createChannelWithVote',
      args: [name, description, voteQuestion, voteOptions, isMultiChoice],
    });
  };

  /**
   * Cast encrypted vote (NEW)
   * @param channelId - Channel ID to vote in
   * @param encryptedOption - Encrypted option handle (from FHE SDK)
   * @param proof - ZK proof (from FHE SDK)
   */
  const vote = async (
    channelId: bigint,
    encryptedOption: `0x${string}`,
    proof: `0x${string}`
  ) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'vote',
      args: [channelId, encryptedOption, proof],
    });
  };

  // ============= Message Functions =============

  /**
   * Post a message to a channel
   */
  const postMessage = async (channelId: bigint, content: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'postMessage',
      args: [channelId, content],
    });
  };

  /**
   * Post a reply to a message
   */
  const postReply = async (messageId: bigint, content: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialVoting,
      abi: ABIS.FHESocialVoting,
      functionName: 'postReply',
      args: [messageId, content],
    });
  };

  return {
    // Write functions
    registerUser,
    updateUsername,
    createChannelWithVote,
    vote,
    postMessage,
    postReply,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}

// ============= Read Hooks =============

/**
 * Get user profile
 */
export function useUserProfile(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getUserProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get channel details
 */
export function useChannel(channelId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getChannel',
    args: channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== undefined,
    },
  });
}

/**
 * Get message details
 */
export function useMessage(messageId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getMessage',
    args: messageId !== undefined ? [messageId] : undefined,
    query: {
      enabled: messageId !== undefined,
    },
  });
}

/**
 * Get channel messages
 */
export function useChannelMessages(channelId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getChannelMessages',
    args: channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== undefined,
      refetchInterval: 5000, // Refetch every 5 seconds for new messages
    },
  });
}

/**
 * Get platform statistics
 */
export function useStats() {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getStats',
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
}

/**
 * Get reply details
 */
export function useReply(messageId?: bigint, replyId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getReply',
    args: messageId !== undefined && replyId !== undefined ? [messageId, replyId] : undefined,
    query: {
      enabled: messageId !== undefined && replyId !== undefined,
    },
  });
}

/**
 * Get vote info (NEW)
 */
export function useVoteInfo(channelId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'getVoteInfo',
    args: channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== undefined,
    },
  });
}

/**
 * Check if user has voted (NEW)
 */
export function useHasVoted(channelId?: bigint, address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.FHESocialVoting,
    abi: ABIS.FHESocialVoting,
    functionName: 'hasVoted',
    args: channelId !== undefined && address ? [channelId, address] : undefined,
    query: {
      enabled: channelId !== undefined && !!address,
    },
  });
}
