import { Network, networks, Psbt } from 'bitcoinjs-lib';
import { EventEmitter } from 'events';
import { ECPairInterface } from '../../bitcoin-core';
import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371';
import { tweakSigner } from '../../utils';
import { signMessageOfDeterministicECDSA, verifyMessageOfECDSA } from '../../message';

interface BaseKeyringOptions {
    readonly network?: Network;
}

export interface SimpleKeyringOptions extends BaseKeyringOptions {
    readonly privateKeys?: string[];
}

export interface DeserializeOptionBase extends BaseKeyringOptions {
    readonly hdPath?: string;
    readonly activeIndexes?: number[];
}

export interface DeserializeOption extends DeserializeOptionBase {
    readonly mnemonic?: string;
    readonly xpriv?: string;
    readonly passphrase?: string;
}

export interface KeystoneKey {
    readonly path: string;
    readonly extendedPublicKey: string;
}

export interface DeserializeOptionKeystone extends DeserializeOptionBase {
    readonly mfp: string;
    readonly keys: KeystoneKey[];
}

export type KeyringOptions = SimpleKeyringOptions | DeserializeOption | DeserializeOptionKeystone;

export abstract class IKeyringBase<T extends BaseKeyringOptions> extends EventEmitter {
    static type = '';
    public type = '';

    protected wallets: ECPairInterface[] = [];

    protected constructor(public readonly network: Network = networks.bitcoin) {
        super();
    }

    public abstract serialize(): T;

    public abstract addAccounts(numberOfAccounts: number): string[];

    public abstract deserialize(opts?: T): unknown;

    public removeAccount(publicKey: string): void {
        if (!this.wallets.map((wallet) => wallet.publicKey.toString('hex')).includes(publicKey)) {
            throw new Error(`PublicKey ${publicKey} not found in this keyring`);
        }

        this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString('hex') !== publicKey);
    }

    public async verifyMessage(publicKey: string, text: string, sig: string): Promise<boolean> {
        return verifyMessageOfECDSA(publicKey, text, sig);
    }

    // Sign any content, but note that the content signed by this method is unreadable, so use it with caution.
    public signData(publicKey: string, data: string, type: 'ecdsa' | 'schnorr' = 'ecdsa'): string {
        const keyPair = this._getPrivateKeyFor(publicKey);
        if (type === 'ecdsa') {
            return keyPair.sign(Buffer.from(data, 'hex')).toString('hex');
        } else if (type === 'schnorr') {
            return keyPair.signSchnorr(Buffer.from(data, 'hex')).toString('hex');
        } else {
            throw new Error('Not support type');
        }
    }

    public abstract getAccounts(): string[];

    public signMessage(publicKey: string, text: string): string {
        const keyPair = this._getPrivateKeyFor(publicKey);
        return signMessageOfDeterministicECDSA(keyPair, text);
    }

    public exportAccount(publicKey: string) {
        const wallet = this._getWalletForAccount(publicKey);
        return wallet.privateKey.toString('hex');
    }

    public signTransaction(
        psbt: Psbt,
        inputs: {
            index: number;
            publicKey: string;
            sighashTypes?: number[];
            disableTweakSigner?: boolean;
        }[],
        opts?: any
    ): Psbt {
        inputs.forEach((input) => {
            const keyPair = this._getPrivateKeyFor(input.publicKey);
            if (isTaprootInput(psbt.data.inputs[input.index]) && !input.disableTweakSigner) {
                const signer = tweakSigner(keyPair, opts);
                psbt.signInput(input.index, signer, input.sighashTypes);
            } else {
                psbt.signInput(input.index, keyPair, input.sighashTypes);
            }
        });
        return psbt;
    }

    private _getWalletForAccount(publicKey: string) {
        let wallet = this.wallets.find((wallet) => wallet.publicKey.toString('hex') == publicKey);
        if (!wallet) {
            throw new Error('Simple Keyring - Unable to find matching publicKey.');
        }
        return wallet;
    }

    private _getPrivateKeyFor(publicKey: string) {
        if (!publicKey) {
            throw new Error('Must specify publicKey.');
        }
        return this._getWalletForAccount(publicKey);
    }
}
