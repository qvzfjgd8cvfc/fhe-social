import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Use a more reliable RPC with rate limiting settings
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

// RainbowKit configuration
export const config = getDefaultConfig({
  appName: 'VoxCircle',
  projectId: 'voxcircle-fhe-social', // WalletConnect project ID
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC, {
      batch: {
        wait: 100, // Wait 100ms to batch requests
      },
      retryCount: 3,
      retryDelay: 1000, // 1 second delay between retries
    }),
  },
  ssr: false,
});

// Export chain and RPC for use in components
export { sepolia };
export const SEPOLIA_RPC_URL = SEPOLIA_RPC;
