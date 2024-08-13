import * as bip39 from 'bip39';
import bitcore from 'bitcore-lib';
import hdkey from 'hdkey';
import { bitcoin, ECPair, ECPairInterface } from '../bitcoin-core';
import { DeserializeOption, IKeyringBase } from './interfaces/SimpleKeyringOptions';

const hdPathString = "m/44'/0'/0'/0";
const type = 'HD Key Tree';

export class HdKeyring extends IKeyringBase {
    static type = type;

    type = type;
    mnemonic: string = null;
    xpriv: string = null;
    passphrase: string;

    hdPath = hdPathString;
    root: bitcore.HDPrivateKey = null;
    hdWallet?: any;
    wallets: ECPairInterface[] = [];
    activeIndexes: number[] = [];
    page = 0;
    perPage = 5;

    private _index2wallet: Record<number, [string, ECPairInterface]> = {};

    /* PUBLIC METHODS */
    constructor(opts?: DeserializeOption) {
        super(opts?.network || bitcoin.networks.bitcoin);

        if (opts) {
            this.deserialize(opts);
        }
    }

    public serialize(): DeserializeOption {
        return {
            mnemonic: this.mnemonic,
            xpriv: this.xpriv,
            activeIndexes: this.activeIndexes,
            hdPath: this.hdPath,
            passphrase: this.passphrase
        };
    }

    public deserialize(_opts: DeserializeOption = {}) {
        if (this.root) {
            throw new Error('Btc-Hd-Keyring: Secret recovery phrase already provided');
        }
        let opts = _opts as DeserializeOption;
        this.wallets = [];
        this.mnemonic = null;
        this.xpriv = null;
        this.root = null;
        this.hdPath = opts.hdPath || hdPathString;
        if (opts.passphrase) {
            this.passphrase = opts.passphrase;
        }

        if (opts.mnemonic) {
            this.initFromMnemonic(opts.mnemonic);
        } else if (opts.xpriv) {
            this.initFromXpriv(opts.xpriv);
        }

        if (opts.activeIndexes) {
            this.activeAccounts(opts.activeIndexes);
        }
    }

    public initFromXpriv(xpriv: string) {
        if (this.root) {
            throw new Error('Btc-Hd-Keyring: Secret recovery phrase already provided');
        }

        this.xpriv = xpriv;
        this._index2wallet = {};

        // @ts-ignore
        this.hdWallet = hdkey.fromJSON({ xpriv });
        this.root = this.hdWallet;
    }

    public initFromMnemonic(mnemonic: string) {
        if (this.root) {
            throw new Error('Btc-Hd-Keyring: Secret recovery phrase already provided');
        }

        this.mnemonic = mnemonic;
        this._index2wallet = {};

        const seed = bip39.mnemonicToSeedSync(mnemonic, this.passphrase);
        this.hdWallet = hdkey.fromMasterSeed(seed);
        this.root = this.hdWallet.derive(this.hdPath);
    }

    public changeHdPath(hdPath: string) {
        if (!this.mnemonic) {
            throw new Error('Btc-Hd-Keyring: Not support');
        }

        this.hdPath = hdPath;

        this.root = this.hdWallet.derive(this.hdPath);

        const indexes = this.activeIndexes;
        this._index2wallet = {};
        this.activeIndexes = [];
        this.wallets = [];
        this.activeAccounts(indexes);
    }

    public getAccountByHdPath(hdPath: string, index: number) {
        if (!this.mnemonic) {
            throw new Error('Btc-Hd-Keyring: Not support');
        }
        const root = this.hdWallet.derive(hdPath);
        const child = root.deriveChild(index);
        const ecpair = ECPair.fromPrivateKey(child.privateKey, {
            network: this.network
        });
        return ecpair.publicKey.toString('hex');
    }

    public addAccounts(numberOfAccounts = 1): string[] {
        let count = numberOfAccounts;
        let currentIdx = 0;
        const newWallets: ECPairInterface[] = [];

        while (count) {
            const [, wallet] = this._addressFromIndex(currentIdx);
            if (this.wallets.includes(wallet)) {
                currentIdx++;
            } else {
                this.wallets.push(wallet);
                newWallets.push(wallet);
                this.activeIndexes.push(currentIdx);
                count--;
            }
        }

        return newWallets.map((w) => {
            return w.publicKey.toString('hex');
        });
    }

    public activeAccounts(indexes: number[]) {
        const accounts: string[] = [];
        for (const index of indexes) {
            const [address, wallet] = this._addressFromIndex(index);
            this.wallets.push(wallet);
            this.activeIndexes.push(index);

            accounts.push(address);
        }

        return accounts;
    }

    public getFirstPage() {
        this.page = 0;
        return this.__getPage(1);
    }

    public getNextPage() {
        return this.__getPage(1);
    }

    public getPreviousPage() {
        return this.__getPage(-1);
    }

    public getAddresses(start: number, end: number) {
        const from = start;
        const to = end;
        const accounts: { address: string; index: number }[] = [];
        for (let i = from; i < to; i++) {
            const [address] = this._addressFromIndex(i);
            accounts.push({
                address,
                index: i + 1
            });
        }
        return accounts;
    }

    public async __getPage(increment: number) {
        this.page += increment;

        if (!this.page || this.page <= 0) {
            this.page = 1;
        }

        const from = (this.page - 1) * this.perPage;
        const to = from + this.perPage;

        const accounts: { address: string; index: number }[] = [];

        for (let i = from; i < to; i++) {
            const [address] = this._addressFromIndex(i);
            accounts.push({
                address,
                index: i + 1
            });
        }

        return accounts;
    }

    public getAccounts(): string[] {
        return this.wallets.map((w) => {
            return w.publicKey.toString('hex');
        });
    }

    public getIndexByAddress(address: string) {
        for (const key in this._index2wallet) {
            if (this._index2wallet[key][0] === address) {
                return Number(key);
            }
        }
        return null;
    }

    private _addressFromIndex(i: number): [string, ECPairInterface] {
        if (!this._index2wallet[i]) {
            const child = this.root.deriveChild(i);

            // @ts-ignore
            const ecpair = ECPair.fromPrivateKey(child.privateKey || Buffer.from(child.toString(), 'hex'), {
                network: this.network
            });
            const address = ecpair.publicKey.toString('hex');
            this._index2wallet[i] = [address, ecpair];
        }

        return this._index2wallet[i];
    }
}
