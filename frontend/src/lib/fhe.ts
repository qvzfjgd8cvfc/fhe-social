/**
 * FHE Encryption Utilities for VoxCircle
 * Using CDN-loaded Zama FHE SDK 0.3.0-5
 * Uses SDK's built-in SepoliaConfig (same as LuckyVault)
 */

import { bytesToHex, getAddress } from "viem";
import type { Address } from "viem";

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;

const getSDK = () => {
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires a browser environment");
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error("Relayer SDK not loaded. Ensure the CDN script tag is present.");
  }
  return sdk;
};

/**
 * Initialize FHE instance with Sepolia network configuration
 * Uses SDK's built-in SepoliaConfig for compatibility
 */
export const initializeFHE = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires a browser environment");
  }

  const ethereumProvider =
    provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;
  if (!ethereumProvider) {
    throw new Error("No wallet provider detected. Connect a wallet first.");
  }

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;

  console.log("[FHE] Initializing SDK...");
  await initSDK();

  // Use SDK's built-in SepoliaConfig (same as LuckyVault)
  // Note: SepoliaConfig handles network configuration internally
  const config = { ...SepoliaConfig, network: ethereumProvider };

  console.log("[FHE] Creating FHE instance with SepoliaConfig...");

  try {
    fheInstance = await createInstance(config);
    console.log("[FHE] FHE instance created successfully");
    return fheInstance;
  } catch (error: any) {
    console.error("[FHE] Failed to create instance:", error);
    // Reset instance on failure so next attempt tries fresh
    fheInstance = null;

    if (error.message?.includes('getKmsSigners')) {
      throw new Error(
        'FHE service connection failed. Please try again in a few moments.'
      );
    }
    throw error;
  }
};

const getInstance = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  return initializeFHE(provider);
};

/**
 * Encrypt result type
 */
export type EncryptResult = {
  handles: Uint8Array[];
  inputProof: Uint8Array;
};

/**
 * Convert Uint8Array to hex string
 */
export const toHex = (value: Uint8Array): `0x${string}` => {
  return bytesToHex(value) as `0x${string}`;
};

/**
 * Encrypt a uint8 value (for vote options 0-9)
 */
export const encryptUint8 = async (
  value: number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  if (value < 0 || value > 255) {
    throw new Error("Value out of range for uint8 encryption");
  }

  console.log("[FHE] Encrypting uint8:", value);
  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress as Address);
  const userAddr = getAddress(userAddress as Address);

  console.log("[FHE] Creating encrypted input for:", {
    contract: contractAddr,
    user: userAddr,
  });

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add8(value);

  console.log("[FHE] Encrypting input...");
  const { handles, inputProof } = await input.encrypt();
  console.log("[FHE] Encryption complete, handles:", handles.length);

  if (handles.length < 1) {
    throw new Error("FHE SDK returned insufficient handles");
  }

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt a vote option (0-9)
 * @param optionIndex - The vote option index (0-9)
 * @param contractAddress - The FHESocial contract address
 * @param userAddress - The user's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptVoteOption = async (
  optionIndex: number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  if (optionIndex < 0 || optionIndex > 9) {
    throw new Error("Vote option must be between 0 and 9");
  }
  return encryptUint8(optionIndex, contractAddress, userAddress, provider);
};

/**
 * Encrypt a uint16 value
 */
export const encryptUint16 = async (
  value: number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  if (value < 0 || value > 65535) {
    throw new Error("Value out of range for uint16 encryption");
  }

  console.log("[FHE] Encrypting uint16:", value);
  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress as Address);
  const userAddr = getAddress(userAddress as Address);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add16(value);

  console.log("[FHE] Encrypting...");
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt a uint32 value
 */
export const encryptUint32 = async (
  value: number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  console.log("[FHE] Encrypting uint32:", value);
  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress as Address);
  const userAddr = getAddress(userAddress as Address);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add32(value);

  console.log("[FHE] Encrypting...");
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt a uint64 value
 */
export const encryptUint64 = async (
  value: bigint | number,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  console.log("[FHE] Encrypting uint64:", value);
  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress as Address);
  const userAddr = getAddress(userAddress as Address);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add64(BigInt(value));

  console.log("[FHE] Encrypting...");
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Check if FHE SDK is loaded and ready
 */
export const isFHEReady = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window.RelayerSDK || window.relayerSDK);
};

/**
 * Check if FHE instance is initialized
 */
export const isFheInitialized = (): boolean => {
  return fheInstance !== null;
};

export const isSDKLoaded = isFHEReady;

/**
 * Wait for FHE SDK to be loaded (with timeout)
 */
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (isFHEReady()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
};

/**
 * Get FHE status for debugging
 */
export const getFHEStatus = (): {
  sdkLoaded: boolean;
  instanceReady: boolean;
} => {
  return {
    sdkLoaded: isFHEReady(),
    instanceReady: fheInstance !== null,
  };
};

/**
 * Reset FHE instance (for testing or network changes)
 */
export const resetFheInstance = (): void => {
  fheInstance = null;
};

// Backwards compatibility aliases
export const initFHE = initializeFHE;
