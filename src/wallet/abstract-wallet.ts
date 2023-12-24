import { bitcoin } from "../bitcoin-core";

export interface AbstractWallet {
  signPsbt(psbt: bitcoin.Psbt): Promise<bitcoin.Psbt>;
  signMessage(text: string, type: "bip322-simple" | "ecdsa"): Promise<string>;
}
