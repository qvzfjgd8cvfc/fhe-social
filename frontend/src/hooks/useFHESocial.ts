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
      address: CONTRACTS.FHESocialV2,
      abi: ABIS.FHESocialV2,
      functionName: 'registerUser',
      args: [username],
    });
  };

  /**
   * Update username
   */
  const updateUsername = async (newUsername: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialV2,
      abi: ABIS.FHESocialV2,
      functionName: 'updateUsername',
      args: [newUsername],
    });
  };

  // ============= Channel Functions =============

  /**
   * Create a new channel
   */
  const createChannel = async (name: string, description: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialV2,
      abi: ABIS.FHESocialV2,
      functionName: 'createChannel',
      args: [name, description],
    });
  };

  // ============= Message Functions =============

  /**
   * Post a message to a channel
   */
  const postMessage = async (channelId: bigint, content: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialV2,
      abi: ABIS.FHESocialV2,
      functionName: 'postMessage',
      args: [channelId, content],
    });
  };

  /**
   * Post a reply to a message
   */
  const postReply = async (messageId: bigint, content: string) => {
    return writeContract({
      address: CONTRACTS.FHESocialV2,
      abi: ABIS.FHESocialV2,
      functionName: 'postReply',
      args: [messageId, content],
    });
  };

  return {
    // Write functions
    registerUser,
    updateUsername,
    createChannel,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
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
    address: CONTRACTS.FHESocialV2,
    abi: ABIS.FHESocialV2,
    functionName: 'getReply',
    args: messageId !== undefined && replyId !== undefined ? [messageId, replyId] : undefined,
    query: {
      enabled: messageId !== undefined && replyId !== undefined,
    },
  });
}
