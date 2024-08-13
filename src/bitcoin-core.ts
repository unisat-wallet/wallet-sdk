import ECPairFactory from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { initEccLib } from 'bitcoinjs-lib';

initEccLib(ecc);

export const ECPair = ECPairFactory(ecc);
export { ECPairInterface } from 'ecpair';
export { ecc, bitcoin };
