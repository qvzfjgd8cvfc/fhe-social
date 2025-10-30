/**
 * FHE Encryption Utilities for FHE Social
 * Using @zama-fhe/relayer-sdk 0.2.0 (Official Package)
 */

import { createFhevmInstance, type RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web';
import { getAddress } from 'viem';

// Sepolia configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RELAYER_URL = 'https://relayer.sepolia.zama.ai';

let fheInstance: any = null;
let fheInstancePromise: Promise<any> | null = null;

/**
 * Initialize FHE instance for Sepolia network using official SDK
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

    console.log('⏳ Creating FHE instance with Sepolia configuration...');

    // Create FHE instance using official SDK
    fheInstance = await createFhevmInstance({
      chainId: SEPOLIA_CHAIN_ID,
      network: ethereumProvider,
      relayerUrl: SEPOLIA_RELAYER_URL,
    });

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
  return ('0x' + Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
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

  const input = fhe.createEncryptedInput(checksumContract, checksumUser) as RelayerEncryptedInput;
  input.add8(value);

  console.log('⏳ Encrypting...');
  const result: EncryptResult = await input.encrypt();
  console.log('📦 Raw encryption result:', result);

  if (!result || !result.handles || !result.inputProof) {
    throw new Error('Encryption returned invalid result');
  }

  const handle = toHex(result.handles[0]);
  const proof = toHex(result.inputProof);

  console.log('✅ Encrypted uint8 successfully');
  console.log('📝 Final handle:', handle);
  console.log('📝 Final proof:', proof);
  console.log('📝 Proof length:', proof.length);

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

  const input = fhe.createEncryptedInput(checksumContract, checksumUser) as RelayerEncryptedInput;
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

  const input = fhe.createEncryptedInput(checksumContract, checksumUser) as RelayerEncryptedInput;
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

  const input = fhe.createEncryptedInput(checksumContract, checksumUser) as RelayerEncryptedInput;
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
  fheInstancePromise = null;
}

// Backwards compatibility alias
export const initFHE = initializeFHE;
