import { decode } from 'bs58check';
import { bitcoin, ECPair, ECPairInterface } from '../bitcoin-core';
import { IKeyringBase, SimpleKeyringOptions } from './interfaces/SimpleKeyringOptions';

const type = 'Simple Key Pair';

export class SimpleKeyring extends IKeyringBase<SimpleKeyringOptions> {
    static type = type;
    type = type;

    constructor(opts?: SimpleKeyringOptions) {
        super(opts?.network || bitcoin.networks.bitcoin);

        if (opts && opts.privateKeys) {
            this.deserialize(opts as SimpleKeyringOptions);
        }
    }

    public serialize(): SimpleKeyringOptions {
        return {
            privateKeys: this.wallets.map((wallet) => wallet.privateKey.toString('hex')),
            network: this.network
        };
    }

    public deserialize(opts: SimpleKeyringOptions): void {
        if (Array.isArray(opts)) {
            opts = { privateKeys: opts }; // compatibility
        }

        this.wallets = opts.privateKeys.map((key) => {
            let buf: Buffer;
            if (key.length === 64) {
                // privateKey
                buf = Buffer.from(key, 'hex');
            } else {
                // base58
                buf = Buffer.from(decode(key).slice(1, 33));
            }

            return ECPair.fromPrivateKey(buf);
        });
    }

    public addAccounts(n = 1): string[] {
        const newWallets: ECPairInterface[] = [];
        for (let i = 0; i < n; i++) {
            newWallets.push(ECPair.makeRandom());
        }
        this.wallets = this.wallets.concat(newWallets);
        return newWallets.map(({ publicKey }) => publicKey.toString('hex'));
    }

    public getAccounts(): string[] {
        return this.wallets.map(({ publicKey }) => publicKey.toString('hex'));
    }
}

export function verifySignData(publicKey: string, hash: string, type: 'ecdsa' | 'schnorr', signature: string) {
    const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
    if (type === 'ecdsa') {
        return keyPair.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
    } else if (type === 'schnorr') {
        return keyPair.verifySchnorr(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
    } else {
        throw new Error('Not support type');
    }
}
