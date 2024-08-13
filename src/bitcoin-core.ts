import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
export { ECPairInterface } from 'ecpair';
export { ECPair, bitcoin, ecc };
