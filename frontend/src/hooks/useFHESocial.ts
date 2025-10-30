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
  const register = async (username: string) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'register',
      args: [username],
    });
  };

  // ============= Channel Functions =============

  /**
   * Create a channel
   */
  const createChannel = async (name: string, description: string) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'createChannel',
      args: [name, description],
    });
  };

  /**
   * Create a channel with voting in one transaction
   */
  const createChannelWithVote = async (
    name: string,
    description: string,
    voteQuestion: string,
    voteOptions: string[],
    voteDuration: bigint
  ) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'createChannelWithVote',
      args: [name, description, voteQuestion, voteOptions, voteDuration],
    });
  };

  /**
   * Create a voting poll in a channel
   */
  const createVote = async (
    channelId: bigint,
    question: string,
    options: string[],
    duration: bigint
  ) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'createVote',
      args: [channelId, question, options, duration],
    });
  };

  // ============= Voting Functions =============

  /**
   * Cast encrypted vote
   * @param channelId - Channel ID to vote in
   * @param encryptedOption - Encrypted option handle (bytes32 from FHE SDK)
   * @param proof - Input proof (from FHE SDK)
   */
  const vote = async (
    channelId: bigint,
    encryptedOption: `0x${string}`,
    proof: `0x${string}`
  ) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'castVote',
      args: [channelId, encryptedOption, proof],
    });
  };

  // ============= Message Functions =============

  /**
   * Post a message to a channel (can be anonymous)
   */
  const postMessage = async (channelId: bigint, content: string, isAnonymous: boolean) => {
    return writeContract({
      address: CONTRACTS.FHESocial,
      abi: ABIS.FHESocial,
      functionName: 'postMessage',
      args: [channelId, content, isAnonymous],
    });
  };

  return {
    // Write functions
    register,
    createChannel,
    createChannelWithVote,
    createVote,
    vote,
    postMessage,

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
 * Get user information
 */
export function useUser(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'getUser',
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
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'getChannel',
    args: channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== undefined,
    },
  });
}

/**
 * Get messages from a channel
 */
export function useMessages(channelId?: bigint, offset: bigint = 0n, limit: bigint = 50n) {
  return useReadContract({
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'getMessages',
    args: channelId !== undefined ? [channelId, offset, limit] : undefined,
    query: {
      enabled: channelId !== undefined,
      refetchInterval: 5000, // Refetch every 5 seconds for new messages
    },
  });
}

/**
 * Get vote info
 */
export function useVoteInfo(channelId?: bigint) {
  return useReadContract({
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'getVoteInfo',
    args: channelId !== undefined ? [channelId] : undefined,
    query: {
      enabled: channelId !== undefined,
    },
  });
}

/**
 * Check if user has voted
 */
export function useHasVoted(channelId?: bigint, address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'hasVoted',
    args: channelId !== undefined && address ? [channelId, address] : undefined,
    query: {
      enabled: channelId !== undefined && !!address,
    },
  });
}

/**
 * Get channel count
 */
export function useChannelCount() {
  return useReadContract({
    address: CONTRACTS.FHESocial,
    abi: ABIS.FHESocial,
    functionName: 'channelCount',
    query: {
      refetchInterval: 10000,
    },
  });
}
