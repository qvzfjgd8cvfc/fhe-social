/**
 * FHE Encryption Utilities for FHE Social
 * Uses Zama Relayer SDK 0.2.0 via CDN
 */

import { getAddress as getEthersAddress } from 'ethers';
import { getAddress, toHex } from 'viem';

// Declare global relayerSDK from CDN
declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
  }
}

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs';

let fheInstance: any = null;
let fheInstancePromise: Promise<any> | null = null;
let sdkPromise: Promise<any> | null = null;

/**
 * Load Relayer SDK from CDN
 */
const loadSdk = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(window.relayerSDK));
        existing.addEventListener('error', () => reject(new Error('Failed to load FHE SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.relayerSDK) {
          resolve(window.relayerSDK);
        } else {
          reject(new Error('relayerSDK unavailable after load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load FHE SDK'));
      document.body.appendChild(script);
    });
  }

  return sdkPromise;
};

/**
 * Ensure handle and proof are present in encryption result and convert to hex
 */
const ensureHandlePayload = (handles: unknown[], inputProof: Uint8Array): { handle: `0x${string}`; proof: `0x${string}` } => {
  if (!Array.isArray(handles) || handles.length === 0) {
    throw new Error('Encryption did not return any handles');
  }
  if (!inputProof) {
    throw new Error('Encryption did not return inputProof');
  }

  return {
    handle: toHex(handles[0] as Uint8Array),
    proof: toHex(inputProof),
  };
};

/**
 * Initialize FHE instance for Sepolia network
 */
export async function initializeFHE(provider?: any): Promise<any> {
  if (fheInstance) {
    console.log('✅ Using cached FHE instance');
    return fheInstance;
  }

  if (fheInstancePromise) {
    console.log('⏳ Waiting for existing FHE initialization...');
    return fheInstancePromise;
  }

  fheInstancePromise = (async () => {
    console.log('🔧 Starting FHE SDK initialization...');

    if (typeof window === 'undefined') {
      throw new Error('FHE SDK requires browser environment');
    }

    // Get Ethereum provider
    const ethereumProvider = provider || window.ethereum;

    if (!ethereumProvider) {
      console.error('❌ No Ethereum provider found');
      throw new Error('Ethereum provider not found. Please connect your wallet first.');
    }
    console.log('✅ Ethereum provider found');

    const sdk = await loadSdk();
    if (!sdk) {
      console.error('❌ FHE SDK not loaded');
      throw new Error('FHE SDK not available');
    }
    console.log('✅ FHE SDK loaded');

    console.log('⏳ Initializing SDK...');
    await sdk.initSDK();
    console.log('✅ SDK initialized');

    const config = {
      ...sdk.SepoliaConfig,
      network: ethereumProvider,
    };
    console.log('⏳ Creating FHE instance with config');

    fheInstance = await sdk.createInstance(config);
    console.log('✅ FHE instance created successfully');
    return fheInstance;
  })();

  try {
    return await fheInstancePromise;
  } finally {
    fheInstancePromise = null;
  }
}

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
  const result = await input.encrypt();
  console.log('📦 Raw encryption result:', result);
  console.log('📦 Result type:', typeof result);
  console.log('📦 Result keys:', Object.keys(result || {}));

  if (!result) {
    throw new Error('Encryption returned null or undefined');
  }

  const { handles, inputProof } = result;
  console.log('📝 Handles:', handles);
  console.log('📝 InputProof:', inputProof);
  console.log('📝 InputProof type:', typeof inputProof);
  console.log('📝 InputProof length:', inputProof?.length);

  const payload = ensureHandlePayload(handles, inputProof);

  console.log('✅ Encrypted uint8 successfully');
  console.log('📝 Final handle:', payload.handle);
  console.log('📝 Final proof:', payload.proof);
  console.log('📝 Final proof length:', payload.proof.length);

  return payload;
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
  const result = await input.encrypt();
  const { handles, inputProof } = result;
  const payload = ensureHandlePayload(handles, inputProof);
  console.log('✅ Encrypted uint16');

  return payload;
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
  const result = await input.encrypt();
  const { handles, inputProof } = result;
  const payload = ensureHandlePayload(handles, inputProof);
  console.log('✅ Encrypted uint32');

  return payload;
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
  const result = await input.encrypt();
  const { handles, inputProof } = result;
  const payload = ensureHandlePayload(handles, inputProof);
  console.log('✅ Encrypted uint64');

  return payload;
};

/**
 * Encrypt Ethereum address to uint64
 * @param address - Ethereum address to encrypt
 * @param contractAddress - Target contract address
 * @param userAddress - User's wallet address
 */
export const encryptAddress = async (
  address: string,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  // Convert address to uint64 (take last 8 bytes)
  const addressBigInt = BigInt(address);
  const uint64Value = addressBigInt & BigInt('0xFFFFFFFFFFFFFFFF');

  return encryptUint64(uint64Value, contractAddress, userAddress);
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
  fheInstancePromise = null;
}

// Backwards compatibility alias
export const initFHE = initializeFHE;
