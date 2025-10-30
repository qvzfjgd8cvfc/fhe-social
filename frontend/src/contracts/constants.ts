import FHESocialJSON from './FHESocial.json';

// Contract addresses from environment variables
export const CONTRACTS = {
  FHESocial: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
};

// ABIs
export const ABIS = {
  FHESocial: FHESocialJSON.abi,
};

// Chain configuration
export const SEPOLIA_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID) || 11155111;
