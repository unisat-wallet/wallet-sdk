import bitcore from 'bitcore-lib';
import { ECPairInterface } from 'ecpair';

export function signMessageOfECDSA(privateKey: ECPairInterface, text: string) {
    const keyPair = privateKey;
    const message = new bitcore.Message(text);
    // @ts-ignore
    return message.sign(new bitcore.PrivateKey(keyPair.privateKey));
}

export function verifyMessageOfECDSA(publicKey: string, text: string, sig: string) {
    const message = new bitcore.Message(text);
    // @ts-ignore
    const signature = bitcore.crypto.Signature.fromCompact(Buffer.from(sig, 'base64'));
    const hash = message.magicHash();

    // recover the public key
    // @ts-ignore
    const ecdsa = new bitcore.crypto.ECDSA();
    ecdsa.hashbuf = hash;
    ecdsa.sig = signature;

    const pubkeyInSig = ecdsa.toPublicKey();

    const pubkeyInSigString = new bitcore.PublicKey(
        Object.assign({}, pubkeyInSig.toObject(), { compressed: true })
    ).toString();
    if (pubkeyInSigString != publicKey) {
        return false;
    }

    return bitcore.crypto.ECDSA.verify(hash, signature, pubkeyInSig);
}
