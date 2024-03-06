import { UTXO_DUST } from "../constants";
import { ErrorCodes, WalletUtilsError } from "../error";
import { NetworkType } from "../network";
import { Transaction } from "../transaction/transaction";
import { utxoHelper } from "../transaction/utxo";
import { ToSignInput, UnspentOutput } from "../types";

export async function sendBTC({
  btcUtxos,
  tos,
  networkType,
  changeAddress,
  feeRate,
  enableRBF = true,
  memo,
}: {
  btcUtxos: UnspentOutput[];
  tos: {
    address: string;
    satoshis: number;
  }[];
  networkType: NetworkType;
  changeAddress: string;
  feeRate: number;
  enableRBF?: boolean;
  memo?: string;
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  tos.forEach((v) => {
    tx.addOutput(v.address, v.satoshis);
  });

  if (memo) {
    if (Buffer.from(memo, "hex").toString("hex") === memo) {
      tx.addOpreturn([Buffer.from(memo, "hex")]);
    } else {
      tx.addOpreturn([Buffer.from(memo)]);
    }
  }

  const toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos);

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}

export async function sendAllBTC({
  btcUtxos,
  toAddress,
  networkType,
  feeRate,
  enableRBF = true,
}: {
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: NetworkType;
  feeRate: number;
  enableRBF?: boolean;
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.addOutput(toAddress, UTXO_DUST);

  const toSignInputs: ToSignInput[] = [];
  btcUtxos.forEach((v, index) => {
    tx.addInput(v);
    toSignInputs.push({ index, publicKey: v.pubkey });
  });

  const fee = await tx.calNetworkFee();
  const unspent = tx.getTotalInput() - fee;
  if (unspent < UTXO_DUST) {
    throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_BTC_UTXO);
  }
  tx.outputs[0].value = unspent;

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
