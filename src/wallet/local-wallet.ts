import { publicKeyToAddress, publicKeyToScriptPk, scriptPkToAddress } from '../address';
import { bitcoin, ECPair } from '../bitcoin-core';
import { HdKeyring, SimpleKeyring } from '../keyring';
import { signMessageOfBIP322Simple } from '../message';
import { NetworkType, toPsbtNetwork } from '../network';
import { AddressType, AddressUserToSignInput, PublicKeyUserToSignInput, SignPsbtOptions, ToSignInput } from '../types';
import { toXOnly } from '../utils';
import { AbstractWallet } from './abstract-wallet';

export class LocalWallet implements AbstractWallet {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    addressType: AddressType;
    networkType: NetworkType;
    scriptPk: string;

    constructor(
        wif: string,
        addressType: AddressType = AddressType.P2WPKH,
        networkType: NetworkType = NetworkType.MAINNET
    ) {
        const network = toPsbtNetwork(networkType);
        const keyPair = ECPair.fromWIF(wif, network);
        this.keyring = new SimpleKeyring({ privateKeys: [keyPair.privateKey.toString('hex')], network: network });
        this.keyring.addAccounts(1);
        this.pubkey = keyPair.publicKey.toString('hex');
        this.address = publicKeyToAddress(this.pubkey, addressType, networkType);
        this.network = network;
        this.networkType = networkType;
        this.addressType = addressType;

        this.scriptPk = publicKeyToScriptPk(this.pubkey, addressType, networkType);
    }

    static fromMnemonic(
        addressType: AddressType,
        networkType: NetworkType,
        mnemonic: string,
        passPhrase?: string,
        hdPath?: string
    ) {
        const keyring = new HdKeyring({
            mnemonic,
            hdPath,
            passphrase: passPhrase,
            activeIndexes: [0]
        });

        const _wallet = keyring.wallets[0];
        _wallet.network = toPsbtNetwork(networkType);

        return new LocalWallet(keyring.wallets[0].toWIF(), addressType, networkType);
    }

    static fromRandom(addressType: AddressType = AddressType.P2WPKH, networkType: NetworkType = NetworkType.MAINNET) {
        const network = toPsbtNetwork(networkType);
        const ecpair = ECPair.makeRandom({ network });
        return new LocalWallet(ecpair.toWIF(), addressType, networkType);
    }

    getNetworkType() {
        return this.networkType;
    }

    async signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions) {
        const _opts = opts || {
            autoFinalized: true,
            toSignInputs: []
        };
        let _inputs: ToSignInput[] = await this.formatOptionsToSignInputs(psbt, opts);

        if (_inputs.length == 0) {
            throw new Error('no input to sign');
        }

        psbt.data.inputs.forEach((v) => {
            const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
            const isP2TR = this.addressType === AddressType.P2TR || this.addressType === AddressType.M44_P2TR;
            const lostInternalPubkey = !v.tapInternalKey;
            // Special measures taken for compatibility with certain applications.
            if (isNotSigned && isP2TR && lostInternalPubkey) {
                const tapInternalKey = toXOnly(Buffer.from(this.pubkey, 'hex'));
                const { output } = bitcoin.payments.p2tr({
                    internalPubkey: tapInternalKey,
                    network: toPsbtNetwork(this.networkType)
                });
                if (v.witnessUtxo?.script.toString('hex') == output?.toString('hex')) {
                    v.tapInternalKey = tapInternalKey;
                }
            }
        });

        psbt = this.keyring.signTransaction(psbt, _inputs);
        if (_opts.autoFinalized) {
            _inputs.forEach((v) => {
                // psbt.validateSignaturesOfInput(v.index, validator);
                psbt.finalizeInput(v.index);
            });
        }
        return psbt;
    }

    getPublicKey(): string {
        const pubkeys = this.keyring.getAccounts();
        return pubkeys[0];
    }

    async signMessage(text: string, type: 'bip322-simple' | 'ecdsa'): Promise<string> {
        if (type === 'bip322-simple') {
            return await signMessageOfBIP322Simple({
                message: text,
                address: this.address,
                networkType: this.networkType,
                wallet: this
            });
        } else {
            const pubkey = this.getPublicKey();
            return this.keyring.signMessage(pubkey, text);
        }
    }

    async signData(data: string, type: 'ecdsa' | 'schnorr' = 'ecdsa') {
        const pubkey = this.getPublicKey();
        return this.keyring.signData(pubkey, data, type);
    }

    private async formatOptionsToSignInputs(_psbt: string | bitcoin.Psbt, options?: SignPsbtOptions) {
        const accountAddress = this.address;
        const accountPubkey = this.getPublicKey();

        let toSignInputs: ToSignInput[] = [];
        if (options && options.toSignInputs) {
            // We expect userToSignInputs objects to be similar to ToSignInput interface,
            // but we allow address to be specified in addition to publicKey for convenience.
            toSignInputs = options.toSignInputs.map((input) => {
                const index = Number(input.index);
                if (isNaN(index)) throw new Error('invalid index in toSignInput');

                if (!(input as AddressUserToSignInput).address && !(input as PublicKeyUserToSignInput).publicKey) {
                    throw new Error('no address or public key in toSignInput');
                }

                if (
                    (input as AddressUserToSignInput).address &&
                    (input as AddressUserToSignInput).address != accountAddress
                ) {
                    throw new Error('invalid address in toSignInput');
                }

                if (
                    (input as PublicKeyUserToSignInput).publicKey &&
                    (input as PublicKeyUserToSignInput).publicKey != accountPubkey
                ) {
                    throw new Error('invalid public key in toSignInput');
                }

                const sighashTypes = input.sighashTypes?.map(Number);
                if (sighashTypes?.some(isNaN)) throw new Error('invalid sighash type in toSignInput');

                return {
                    index,
                    publicKey: accountPubkey,
                    sighashTypes,
                    disableTweakSigner: input.disableTweakSigner
                };
            });
        } else {
            const networkType = this.getNetworkType();
            const psbtNetwork = toPsbtNetwork(networkType);

            const psbt =
                typeof _psbt === 'string'
                    ? bitcoin.Psbt.fromHex(_psbt as string, { network: psbtNetwork })
                    : (_psbt as bitcoin.Psbt);
            psbt.data.inputs.forEach((v, index) => {
                let script: any = null;
                if (v.witnessUtxo) {
                    script = v.witnessUtxo.script;
                } else if (v.nonWitnessUtxo) {
                    const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
                    const output = tx.outs[psbt.txInputs[index].index];
                    script = output.script;
                }
                const isSigned = v.finalScriptSig || v.finalScriptWitness;
                if (script && !isSigned) {
                    const address = scriptPkToAddress(script, this.networkType);
                    if (accountAddress === address) {
                        toSignInputs.push({
                            index,
                            publicKey: accountPubkey,
                            sighashTypes: v.sighashType ? [v.sighashType] : undefined
                        });
                    }
                }
            });
        }
        return toSignInputs;
    }
}
