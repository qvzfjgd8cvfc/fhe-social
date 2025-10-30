/**
 * Test FHE Configuration
 */

import { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export function logSepoliaConfig() {
  console.log('=== Sepolia Config ===');
  console.log('chainId:', SepoliaConfig.chainId);
  console.log('gatewayChainId:', SepoliaConfig.gatewayChainId);
  console.log('relayerUrl:', SepoliaConfig.relayerUrl);
  console.log('aclContractAddress:', SepoliaConfig.aclContractAddress);
  console.log('kmsContractAddress:', SepoliaConfig.kmsContractAddress);
  console.log('inputVerifierContractAddress:', SepoliaConfig.inputVerifierContractAddress);
  console.log('verifyingContractAddressDecryption:', SepoliaConfig.verifyingContractAddressDecryption);
  console.log('verifyingContractAddressInputVerification:', SepoliaConfig.verifyingContractAddressInputVerification);
  console.log('network:', SepoliaConfig.network);
  console.log('======================');
}
