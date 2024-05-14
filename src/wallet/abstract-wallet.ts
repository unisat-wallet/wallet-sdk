import { bitcoin } from '../bitcoin-core';
import { SignPsbtOptions } from '../types';

export interface AbstractWallet {
  signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): Promise<bitcoin.Psbt>;
  signMessage(text: string, type: 'bip322-simple' | 'ecdsa'): Promise<string>;
}
