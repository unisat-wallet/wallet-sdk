import { EventEmitter } from "events";
import bitcore from "bitcore-lib";
import KeystoneSDK, { KeystoneBitcoinSDK, UR } from '@keystonehq/keystone-sdk';
import { bitcoin } from '../bitcoin-core';
import { verifyMessageOfECDSA } from '../message';
import { uuid } from '@keystonehq/keystone-sdk/dist/utils';

interface KeystoneKey {
  path: string;
  extendedPublicKey: string;
}

interface DeserializeOption {
  mfp: string;
  keys: KeystoneKey[];
  hdPath?: string;
  activeIndexes?: number[];
}

interface Wallet {
  index: number;
  publicKey: string;
  path: string;
}

const type = "Keystone";

export class KeystoneKeyring extends EventEmitter {
  static type = type;
  type = type;
  mfp: string = "";
  keys: KeystoneKey[] = [];
  hdPath?: string;
  activeIndexes?: number[] = [];
  root: bitcore.HDPublicKey = null;

  page = 0;
  perPage = 5;

  origin = "UniSat Wallet";

  constructor(opts?: DeserializeOption) {
    super();
    if (opts) {
      this.deserialize(opts);
    }
  }

  async initFromUR(type: string, cbor: string) {
    const keystoneSDK = new KeystoneSDK({
      origin: this.origin,
    });
    const account = keystoneSDK.parseAccount(new UR(Buffer.from(cbor, 'hex'), type));
    await this.deserialize({
      mfp: account.masterFingerprint,
      keys: account.keys.map((k) => ({
        path: k.path,
        extendedPublicKey: k.extendedPublicKey,
      })),
    })
  }

  getHardenedPath(hdPath: string) {
    const paths = hdPath.split("/");
    return paths.slice(0, 4).join("/")
  }

  getHDPublicKey(hdPath: string) {
    const path = this.getHardenedPath(hdPath);
    const key = this.keys.find((v) => v.path === path);
    if (!key) {
      throw new Error("Invalid path");
    }
    return new bitcore.HDPublicKey(key.extendedPublicKey);
  }

  getDefaultHdPath() {
    return 'm/44\'/0\'/0\'/0';
  }

  initRoot() {
    this.root = this.getHDPublicKey(this.hdPath ?? this.getDefaultHdPath());
  }

  async deserialize(opts: DeserializeOption) {
    this.mfp = opts.mfp;
    this.keys = opts.keys;
    this.hdPath = opts.hdPath ?? this.getDefaultHdPath();
    this.activeIndexes = opts.activeIndexes ? [...opts.activeIndexes] : [0];
    this.initRoot();
  }

  async serialize(): Promise<DeserializeOption> {
    return {
      mfp: this.mfp,
      keys: this.keys,
      hdPath: this.hdPath,
      activeIndexes: this.activeIndexes,
    };
  }

  async addAccounts(numberOfAccounts = 1) {
    let count = numberOfAccounts;
    let i = 0;
    const pubkeys = [];

    while (count) {
      if (this.activeIndexes.includes(i)) {
        i++;
      } else {
        const w = this.getWalletByIndex(i);
        pubkeys.push(w.publicKey);
        this.activeIndexes.push(i);
        count--;
      }
    }

    return Promise.resolve(pubkeys);
  }

  async getAccounts() {
    return this.activeIndexes.map((i) => this.getWalletByIndex(i).publicKey);
  }

  async getAccountsWithBrand() {
    return this.activeIndexes.map((i) => {
      const w = this.getWalletByIndex(i);
      return {
        address: w.publicKey,
        index: i,
      }
    });
  }

  getWalletByIndex(index: number): Wallet {
    const child = this.root.derive(`m/0/${index}`);
    return {
      index,
      path: `${this.hdPath}/${index}`,
      publicKey: child.publicKey.toString("hex"),
    };
  }

  removeAccount(publicKey: string) {
    const index = this.activeIndexes.findIndex((i) => {
      const w = this.getWalletByIndex(i);
      return w.publicKey === publicKey;
    });
    if (index !== -1) {
      this.activeIndexes.splice(index, 1);
    }
  }

  async exportAccount(_publicKey: string) {
    throw new Error("Not supported");
  }

  getFirstPage() {
    this.page = 0;
    return this.getPage(1);
  }

  getNextPage() {
    return this.getPage(1);
  }

  getPreviousPage() {
    return this.getPage(-1);
  }

  getAddresses(start: number, end: number) {
    const from = start;
    const to = end;
    const accounts: { address: string; index: number }[] = [];
    for (let i = from; i < to; i++) {
      const w = this.getWalletByIndex(i);
      accounts.push({
        address: w.publicKey,
        index: i + 1,
      });
    }
    return accounts;
  }

  async getPage(increment: number) {
    this.page += increment;

    if (!this.page || this.page <= 0) {
      this.page = 1;
    }

    const from = (this.page - 1) * this.perPage;
    const to = from + this.perPage;

    const accounts: { address: string; index: number }[] = [];

    for (let i = from; i < to; i++) {
      const w = this.getWalletByIndex(i);
      accounts.push({
        address: w.publicKey,
        index: i + 1,
      });
    }

    return accounts;
  }

  activeAccounts(indexes: number[]) {
    const accounts: string[] = [];
    for (const index of indexes) {
      const w = this.getWalletByIndex(index);
      
      if (!this.activeIndexes.includes(index)) {
        this.activeIndexes.push(index);
      }

      accounts.push(w.publicKey);
    }

    return accounts;
  }

  changeHdPath(hdPath: string) {
    this.hdPath = hdPath;

    this.initRoot();

    this.activeAccounts(this.activeIndexes);
  }

  getAccountByHdPath(hdPath: string, index: number) {
    const root = this.getHDPublicKey(hdPath);
    const child = root.derive(`m/0/${index}`);
    return child.publicKey.toString("hex");
  }

  async genSignPsbtUr(psbt: bitcoin.Psbt) {
    const keystoneSDK = new KeystoneSDK({
      origin: this.origin,
    });
    const ur = keystoneSDK.btc.generatePSBT(psbt.data.toBuffer());
    return {
      type: ur.type,
      cbor: ur.cbor.toString("hex"),
    }
  }

  async parseSignPsbtUr(type: string, cbor: string) {
    const keystoneSDK = new KeystoneSDK({
      origin: this.origin,
    });
    return keystoneSDK.btc.parsePSBT(new UR(Buffer.from(cbor, 'hex'), type));
  }

  async genSignMsgUr(publicKey: string, text: string) {
    const keystoneSDK = new KeystoneSDK({
      origin: this.origin,
    });
    const i = this.activeIndexes.find((i) => this.getWalletByIndex(i).publicKey === publicKey);
    if (i === undefined) {
      throw new Error("publicKey not found");
    }
    const requestId = uuid.v4();
    const ur = keystoneSDK.btc.generateSignRequest({
      requestId,
      signData: Buffer.from(text).toString("hex"),
      dataType: KeystoneBitcoinSDK.DataType.message,
      accounts: [{
        path: `${this.hdPath}/${i}`,
        xfp: this.mfp,
      }],
      origin: this.origin,
    });
    return {
      requestId,
      type: ur.type,
      cbor: ur.cbor.toString("hex"),
    }
  }

  async parseSignMsgUr(type: string, cbor: string) {
    const keystoneSDK = new KeystoneSDK({
      origin: this.origin,
    });
    return keystoneSDK.btc.parseSignature(new UR(Buffer.from(cbor, 'hex'), type));
  }

  async signMessage(publicKey: string, text: string) {
    return 'Signing Message with Keystone should use genSignMsgUr and parseSignMsgUr';
  }

  async verifyMessage(publicKey: string, text: string, sig: string) {
    return verifyMessageOfECDSA(publicKey, text, sig);
  }
}
