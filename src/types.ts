interface BaseUserToSignInput {
  index: number;
  sighashTypes?: number[] | undefined;
  disableTweakSigner?: boolean;
  tapLeafHashToSign?: Buffer;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;

export interface SignPsbtOptions {
  autoFinalized?: boolean; // whether to finalize psbt automatically
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number; // index of input to sign
  publicKey: string; // public key in hex format
  sighashTypes?: number[]; // sighash types to sign
  disableTweakSigner?: boolean; // whether to use taproot tweak signer, default is true
  tapLeafHashToSign?: Buffer;
}

export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshis: number;
  scriptPk: string;
  pubkey: string;
  addressType: AddressType;
  inscriptions: {
    inscriptionId: string;
    inscriptionNumber?: number;
    offset: number;
  }[];
  atomicals: {
    atomicalId: string;
    atomicalNumber: number;
    type: 'FT' | 'NFT';
    ticker?: string;
    atomicalValue?: number;
  }[];
  runes?: {
    runeid: string;
    amount: string;
  }[];
  rawtx?: string;
}

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH, // deprecated
  M44_P2TR, // deprecated
  P2WSH,
  P2SH,
  UNKNOWN
}
