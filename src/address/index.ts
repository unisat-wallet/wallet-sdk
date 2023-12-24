import { bitcoin } from "../bitcoin-core";
import { NetworkType, toPsbtNetwork } from "../network";
import { AddressType } from "../types";

/**
 * Convert public key to bitcoin payment object.
 */
export function publicKeyToPayment(
  publicKey: string,
  type: AddressType,
  networkType: NetworkType
) {
  const network = toPsbtNetwork(networkType);
  if (!publicKey) return null;
  const pubkey = Buffer.from(publicKey, "hex");
  if (type === AddressType.P2PKH) {
    return bitcoin.payments.p2pkh({
      pubkey,
      network,
    });
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    return bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    return bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1, 33),
      network,
    });
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    return bitcoin.payments.p2sh({
      pubkey,
      network,
      redeem: data,
    });
  }
}

/**
 * Convert public key to bitcoin address.
 */
export function publicKeyToAddress(
  publicKey: string,
  type: AddressType,
  networkType: NetworkType
) {
  const payment = publicKeyToPayment(publicKey, type, networkType);
  if (payment && payment.address) {
    return payment.address;
  } else {
    return "";
  }
}

/**
 * Convert public key to bitcoin scriptPk.
 */
export function publicKeyToScriptPk(
  publicKey: string,
  type: AddressType,
  networkType: NetworkType
) {
  const payment = publicKeyToPayment(publicKey, type, networkType);
  return payment.output.toString("hex");
}

/**
 * Convert bitcoin address to scriptPk.
 */
export function addressToScriptPk(address: string, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType);
  return bitcoin.address.toOutputScript(address, network);
}

/**
 * Check if the address is valid.
 */
export function isValidAddress(
  address: string,
  networkType: NetworkType = NetworkType.MAINNET
) {
  let error;
  try {
    bitcoin.address.toOutputScript(address, toPsbtNetwork(networkType));
  } catch (e) {
    error = e;
  }
  if (error) {
    return false;
  } else {
    return true;
  }
}

/**
 * Get address type.
 */
export function getAddressType(
  address: string,
  networkType: NetworkType = NetworkType.MAINNET
): AddressType {
  const network = toPsbtNetwork(networkType);
  let type: AddressType;

  try {
    const decoded = bitcoin.address.fromBase58Check(address);

    if (decoded.version === network.pubKeyHash) {
      type = AddressType.P2PKH;
    } else if (decoded.version === network.scriptHash) {
      type = AddressType.P2SH_P2WPKH; //P2SH
    } else {
      throw `unknown version number: ${decoded.version}`;
    }
  } catch (error) {
    try {
      // not a Base58 address, try Bech32
      const decodedBech32 = bitcoin.address.fromBech32(address);

      if (decodedBech32.version === 0 && decodedBech32.data.length === 20) {
        type = AddressType.P2WPKH;
      } else if (
        decodedBech32.version === 0 &&
        decodedBech32.data.length === 32
      ) {
        type = AddressType.P2WSH;
      } else if (
        decodedBech32.version === 1 &&
        decodedBech32.data.length === 32
      ) {
        type = AddressType.P2TR;
      } else {
        throw `unknown Bech32 address format`;
      }
    } catch (err) {
      throw "unsupport address type: " + address;
    }
  }
  return type;
}

/**
 * Convert scriptPk to address.
 */
export function scriptPkToAddress(
  scriptPk: string | Buffer,
  networkType: NetworkType = NetworkType.MAINNET
) {
  const network = toPsbtNetwork(networkType);
  try {
    const address = bitcoin.address.fromOutputScript(
      typeof scriptPk === "string" ? Buffer.from(scriptPk, "hex") : scriptPk,
      network
    );
    return address;
  } catch (e) {
    return "";
  }
}
