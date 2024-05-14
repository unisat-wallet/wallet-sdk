import { decodeAddress } from '../address';
import { NetworkType } from '../network';
import { AddressType, UnspentOutput } from '../types';

function hasInscription(utxos: UnspentOutput[]) {
  if (utxos.find((v) => v.inscriptions.length > 0)) {
    return true;
  }
  return false;
}

function hasAtomicalsFT(utxos: UnspentOutput[]) {
  if (utxos.find((v) => v.atomicals.find((w) => w.type === 'FT'))) {
    return true;
  }
  return false;
}

function hasAtomicalsNFT(utxos: UnspentOutput[]) {
  if (utxos.find((v) => v.atomicals.find((w) => w.type === 'NFT'))) {
    return true;
  }
  return false;
}

function hasAtomicals(utxos: UnspentOutput[]) {
  if (utxos.find((v) => v.atomicals.length > 0)) {
    return true;
  }
  return false;
}

function hasAnyAssets(utxos: UnspentOutput[]) {
  if (utxos.find((v) => v.inscriptions.length > 0 || v.atomicals.length > 0)) {
    return true;
  }
  return false;
}

/**
 * select utxos so that the total amount of utxos is greater than or equal to targetAmount
 * return the selected utxos and the unselected utxos
 * @param utxos
 * @param targetAmount
 */
function selectBtcUtxos(utxos: UnspentOutput[], targetAmount: number) {
  let selectedUtxos: UnspentOutput[] = [];
  let remainingUtxos: UnspentOutput[] = [];

  let totalAmount = 0;
  for (const utxo of utxos) {
    if (totalAmount < targetAmount) {
      totalAmount += utxo.satoshis;
      selectedUtxos.push(utxo);
    } else {
      remainingUtxos.push(utxo);
    }
  }

  return {
    selectedUtxos,
    remainingUtxos
  };
}

/**
 * return the added virtual size of the utxo
 */
function getAddedVirtualSize(addressType: AddressType) {
  if (addressType === AddressType.P2WPKH || addressType === AddressType.M44_P2WPKH) {
    return 41 + (1 + 1 + 72 + 1 + 33) / 4;
  } else if (addressType === AddressType.P2TR || addressType === AddressType.M44_P2TR) {
    return 41 + (1 + 1 + 64) / 4;
  } else if (addressType === AddressType.P2PKH) {
    return 41 + 1 + 1 + 72 + 1 + 33;
  } else if (addressType === AddressType.P2SH_P2WPKH) {
    return 41 + 24 + (1 + 1 + 72 + 1 + 33) / 4;
  }
  throw new Error('unknown address type');
}

export function getUtxoDust(addressType: AddressType) {
  if (addressType === AddressType.P2WPKH || addressType === AddressType.M44_P2WPKH) {
    return 294;
  } else if (addressType === AddressType.P2TR || addressType === AddressType.M44_P2TR) {
    return 330;
  } else {
    return 546;
  }
}

// deprecated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAddressUtxoDust(address: string, networkType: NetworkType = NetworkType.MAINNET) {
  return decodeAddress(address).dust;
}

export const utxoHelper = {
  hasAtomicalsFT,
  hasAtomicalsNFT,
  hasAtomicals,
  hasInscription,
  hasAnyAssets,
  selectBtcUtxos,
  getAddedVirtualSize,
  getUtxoDust,
  getAddressUtxoDust
};
