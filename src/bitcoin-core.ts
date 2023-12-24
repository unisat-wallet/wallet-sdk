import ecc from "@bitcoinerlab/secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
export { ECPairInterface } from "ecpair";
export { ECPair, bitcoin, ecc };
