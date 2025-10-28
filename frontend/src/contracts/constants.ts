import FHESocialV2ABI from './FHESocialV2ABI.json';

// Contract addresses from environment variables
export const CONTRACTS = {
  FHESocialV2: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
  UserRegistry: import.meta.env.VITE_USER_REGISTRY_ADDRESS as `0x${string}`,
  ChannelManager: import.meta.env.VITE_CHANNEL_MANAGER_ADDRESS as `0x${string}`,
  MessageManager: import.meta.env.VITE_MESSAGE_MANAGER_ADDRESS as `0x${string}`,
};

// ABIs
export const ABIS = {
  FHESocialV2: FHESocialV2ABI,
};

// Chain configuration
export const SEPOLIA_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID) || 11155111;

