/**
 * FHE Encryption Utilities for FHE Social
 * Using CDN-loaded Zama FHE SDK 0.2.0
 */

import { hexlify, getAddress } from "ethers";

declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;
let sdkPromise: Promise<any> | null = null;

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs';

/**
 * Dynamically load Zama FHE SDK from CDN
 */
const loadSdk = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  if (window.relayerSDK) {
    console.log('✅ SDK already loaded');
    return window.relayerSDK;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        console.log('⏳ SDK script tag exists, waiting...');
        const checkInterval = setInterval(() => {
          if (window.relayerSDK) {
            clearInterval(checkInterval);
            resolve(window.relayerSDK);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.relayerSDK) {
            resolve(window.relayerSDK);
          } else {
            reject(new Error('SDK script exists but window.relayerSDK not initialized'));
          }
        }, 5000);
        return;
      }

      console.log('📦 Loading FHE SDK from CDN...');
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;

      script.onload = () => {
        console.log('📦 Script loaded, waiting for SDK initialization...');
        setTimeout(() => {
          if (window.relayerSDK) {
            console.log('✅ SDK initialized');
            resolve(window.relayerSDK);
          } else {
            console.error('❌ window.relayerSDK still undefined after load');
            reject(new Error('relayerSDK unavailable after load'));
          }
        }, 500);
      };

      script.onerror = () => {
        console.error('❌ Failed to load SDK script');
        reject(new Error('Failed to load FHE SDK'));
      };

      document.body.appendChild(script);
    });
  }

  return sdkPromise;
};

/**
 * Initialize FHE instance with Sepolia network configuration
 */
export async function initializeFHE(provider?: any): Promise<any> {
  if (fheInstance) {
    console.log('✅ Using cached FHE instance');
    return fheInstance;
  }

  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  const ethereumProvider = provider ||
    window.ethereum ||
    (window as any).okxwallet?.provider ||
    (window as any).okxwallet ||
    (window as any).coinbaseWalletExtension;

  if (!ethereumProvider) {
    throw new Error('Ethereum provider not found. Please connect your wallet first.');
  }

  console.log('🔌 Using Ethereum provider');

  const sdk = await loadSdk();
  if (!sdk) {
    throw new Error('FHE SDK not available');
  }

  console.log('🔧 Initializing FHE SDK...');
  await sdk.initSDK();

  const config = {
    ...sdk.SepoliaConfig,
    network: ethereumProvider,
  };

  console.log('⏳ Creating FHE instance...');
  fheInstance = await sdk.createInstance(config);
  console.log('✅ FHE instance initialized for Sepolia');

  return fheInstance;
}

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
  return hexlify(value) as `0x${string}`;
};

/**
 * Encrypt a uint8 value
 */
export const encryptUint8 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  if (value < 0 || value > 255) {
    throw new Error('Value out of range for uint8 encryption');
  }

  console.log(`🔒 Encrypting uint8: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add8(value);

  console.log('⏳ Encrypting...');
  const result: EncryptResult = await input.encrypt();

  if (!result || !result.handles || !result.inputProof) {
    throw new Error('Encryption returned invalid result');
  }

  const handleBytes = result.handles[0];
  const proofBytes = result.inputProof;

  console.log('✅ Encrypted uint8 successfully');
  console.log('📊 Handle bytes length:', handleBytes.length);
  console.log('📊 Handle raw bytes:', Array.from(handleBytes));
  console.log('📊 Proof bytes length:', proofBytes.length);

  // Convert to hex
  let handle = toHex(handleBytes);
  const proof = toHex(proofBytes);

  console.log('📊 Handle hex:', handle);
  console.log('📊 Handle hex length:', handle.length);

  // bytes32 requires exactly 66 characters (0x + 64 hex chars = 32 bytes)
  // If handle is shorter, we need to pad with zeros at the END
  if (handle.length < 66) {
    const paddingNeeded = 66 - handle.length;
    console.warn(`⚠️ Handle length ${handle.length} < 66, padding ${paddingNeeded} zeros`);
    handle = handle + '0'.repeat(paddingNeeded);
    console.log('✅ Padded handle:', handle);
  } else if (handle.length > 66) {
    console.error(`❌ Handle length ${handle.length} > 66! This should not happen`);
    // Truncate to 66 chars
    handle = handle.substring(0, 66);
    console.log('⚠️ Truncated handle:', handle);
  }

  return { handle, proof };
};

/**
 * Encrypt a uint16 value
 */
export const encryptUint16 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  if (value < 0 || value > 65535) {
    throw new Error('Value out of range for uint16 encryption');
  }

  console.log(`🔒 Encrypting uint16: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add16(value);

  console.log('⏳ Encrypting...');
  const result: EncryptResult = await input.encrypt();

  const handle = toHex(result.handles[0]);
  const proof = toHex(result.inputProof);

  console.log('✅ Encrypted uint16');
  return { handle, proof };
};

/**
 * Encrypt a uint32 value
 */
export const encryptUint32 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  console.log(`🔒 Encrypting uint32: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add32(value);

  console.log('⏳ Encrypting...');
  const result: EncryptResult = await input.encrypt();

  const handle = toHex(result.handles[0]);
  const proof = toHex(result.inputProof);

  console.log('✅ Encrypted uint32');
  return { handle, proof };
};

/**
 * Encrypt a uint64 value
 */
export const encryptUint64 = async (
  value: bigint | number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  console.log(`🔒 Encrypting uint64: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add64(Number(value));

  console.log('⏳ Encrypting...');
  const result: EncryptResult = await input.encrypt();

  const handle = toHex(result.handles[0]);
  const proof = toHex(result.inputProof);

  console.log('✅ Encrypted uint64');
  return { handle, proof };
};

/**
 * Check if FHE is initialized
 */
export function isFheInitialized(): boolean {
  return fheInstance !== null;
}

/**
 * Reset FHE instance (for testing or network changes)
 */
export function resetFheInstance(): void {
  fheInstance = null;
  sdkPromise = null;
}

// Backwards compatibility alias
export const initFHE = initializeFHE;
