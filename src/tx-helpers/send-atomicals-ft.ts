import { ErrorCodes, WalletUtilsError } from "../error";
import { NetworkType } from "../network";
import { Transaction } from "../transaction/transaction";
import { utxoHelper } from "../transaction/utxo";
import { ToSignInput, UnspentOutput } from "../types";

// only one arc20 can be send
export async function sendAtomicalsFT({
  assetUtxos,
  btcUtxos,
  toAddress,
  networkType,
  changeAssetAddress,
  sendAmount,
  changeAddress,
  feeRate,
  enableRBF = true,
}: {
  assetUtxos: UnspentOutput[];
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: NetworkType;
  changeAssetAddress: string;
  sendAmount: number;
  changeAddress: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  // safe check
  if (
    utxoHelper.hasAtomicalsNFT(assetUtxos) ||
    utxoHelper.hasInscription(assetUtxos)
  ) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  const toSignInputs: ToSignInput[] = [];

  const totalInputFTAmount = assetUtxos.reduce((acc, v) => acc + v.satoshis, 0);
  if (sendAmount > totalInputFTAmount) {
    throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_ASSET_UTXO);
  }

  // add assets
  assetUtxos.forEach((v, index) => {
    tx.addInput(v);
    toSignInputs.push({ index, publicKey: v.pubkey });
  });

  // add receiver
  tx.addOutput(toAddress, sendAmount);

  // add change
  const changeArc20Amount = totalInputFTAmount - sendAmount;
  if (changeArc20Amount > 0) {
    tx.addOutput(changeAssetAddress, changeArc20Amount);
  }

  // add btc
  const _toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos, true);
  toSignInputs.push(..._toSignInputs);

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
