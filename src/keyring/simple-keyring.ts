import { isTaprootInput, serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { decode } from "bs58check";
import { EventEmitter } from "events";
import { ECPair, ECPairInterface, bitcoin } from "../bitcoin-core";
import {
  signMessageOfDeterministicECDSA,
  verifyMessageOfECDSA,
} from "../message";
import {toXOnly, tweakSigner} from "../utils";

const type = "Simple Key Pair";

export class SimpleKeyring extends EventEmitter {
  static type = type;
  type = type;
  network: bitcoin.Network = bitcoin.networks.bitcoin;
  wallets: ECPairInterface[] = [];
  constructor(opts?: any) {
    super();
    if (opts) {
      this.deserialize(opts);
    }
  }

  async serialize(): Promise<any> {
    return this.wallets.map((wallet) => wallet.privateKey.toString("hex"));
  }

  async deserialize(opts: any) {
    const privateKeys = opts as string[];

    this.wallets = privateKeys.map((key) => {
      let buf: Buffer;
      if (key.length === 64) {
        // privateKey
        buf = Buffer.from(key, "hex");
      } else {
        // base58
        buf = decode(key).slice(1, 33);
      }

      return ECPair.fromPrivateKey(buf);
    });
  }

  async addAccounts(n = 1) {
    const newWallets: ECPairInterface[] = [];
    for (let i = 0; i < n; i++) {
      newWallets.push(ECPair.makeRandom());
    }
    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) =>
      publicKey.toString("hex")
    );
    return hexWallets;
  }

  async getAccounts() {
    return this.wallets.map(({ publicKey }) => publicKey.toString("hex"));
  }

  async signTransaction(
    psbt: bitcoin.Psbt,
    inputs: {
      index: number;
      publicKey: string;
      sighashTypes?: number[];
      disableTweakSigner?: boolean;
      rawTaprootPubkey?: boolean;
    }[],
    opts?: any
  ) {
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const isTapInput = isTaprootInput(psbt.data.inputs[input.index]);
      if (
        isTapInput &&
        !input.disableTweakSigner &&
        !input.rawTaprootPubkey
      ) {
        const signer = tweakSigner(keyPair, opts);
        psbt.signInput(input.index, signer, input.sighashTypes);
      } else if (isTapInput && input.rawTaprootPubkey) {
        const inputAddressInfo = bitcoin.payments.p2tr({
          pubkey: toXOnly(Buffer.from(input.publicKey, 'hex')),
          network: this.network,
        });
        let hashType
        if (!input.sighashTypes) {
          hashType = bitcoin.Transaction.SIGHASH_DEFAULT
        } else if (input.sighashTypes.length > 1) {
          throw new Error('Only one sighash type is supported for raw taproot inputs')
        } else {
          hashType = input.sighashTypes[0]
        }
        const hashForSigning = (psbt as any).__CACHE.__TX.hashForWitnessV1(
            input.index,
            [inputAddressInfo.output],
            [psbt.data.inputs[input.index].witnessUtxo.value],
            hashType
        );
        const signature = keyPair.signSchnorr(hashForSigning);
        psbt.updateInput(input.index, {
          tapKeySig: serializeTaprootSignature(signature)
        })
      } else {
        const signer = keyPair;
        psbt.signInput(input.index, signer, input.sighashTypes);
      }
    });
    return psbt;
  }

  async signMessage(publicKey: string, text: string) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    return signMessageOfDeterministicECDSA(keyPair, text);
  }

  async verifyMessage(publicKey: string, text: string, sig: string) {
    return verifyMessageOfECDSA(publicKey, text, sig);
  }

  // Sign any content, but note that the content signed by this method is unreadable, so use it with caution.
  async signData(
    publicKey: string,
    data: string,
    type: "ecdsa" | "schnorr" = "ecdsa"
  ) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    if (type === "ecdsa") {
      return keyPair.sign(Buffer.from(data, "hex")).toString("hex");
    } else if (type === "schnorr") {
      return keyPair.signSchnorr(Buffer.from(data, "hex")).toString("hex");
    } else {
      throw new Error("Not support type");
    }
  }

  private _getPrivateKeyFor(publicKey: string) {
    if (!publicKey) {
      throw new Error("Must specify publicKey.");
    }
    const wallet = this._getWalletForAccount(publicKey);
    return wallet;
  }

  async exportAccount(publicKey: string) {
    const wallet = this._getWalletForAccount(publicKey);
    return wallet.privateKey.toString("hex");
  }

  removeAccount(publicKey: string) {
    if (
      !this.wallets
        .map((wallet) => wallet.publicKey.toString("hex"))
        .includes(publicKey)
    ) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(
      (wallet) => wallet.publicKey.toString("hex") !== publicKey
    );
  }

  private _getWalletForAccount(publicKey: string) {
    let wallet = this.wallets.find(
      (wallet) => wallet.publicKey.toString("hex") == publicKey
    );
    if (!wallet) {
      throw new Error("Simple Keyring - Unable to find matching publicKey.");
    }
    return wallet;
  }
}

export function verifySignData(
  publicKey: string,
  hash: string,
  type: "ecdsa" | "schnorr",
  signature: string
) {
  const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, "hex"));
  if (type === "ecdsa") {
    return keyPair.verify(
      Buffer.from(hash, "hex"),
      Buffer.from(signature, "hex")
    );
  } else if (type === "schnorr") {
    return keyPair.verifySchnorr(
      Buffer.from(hash, "hex"),
      Buffer.from(signature, "hex")
    );
  } else {
    throw new Error("Not support type");
  }
}
