import { ErrorCodes, WalletUtilsError } from "../error";
import { NetworkType } from "../network";
import { Transaction } from "../transaction/transaction";
import { utxoHelper } from "../transaction/utxo";
import { ToSignInput, UnspentOutput } from "../types";

export async function sendAtomicalsNFT({
  assetUtxo,
  btcUtxos,
  toAddress,
  networkType,
  changeAddress,
  feeRate,
  enableRBF = true,
}: {
  assetUtxo: UnspentOutput;
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: NetworkType;
  changeAddress: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  // safe check
  if (
    utxoHelper.hasAtomicalsFT([assetUtxo]) ||
    utxoHelper.hasInscription([assetUtxo])
  ) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (assetUtxo.atomicals.length !== 1) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  const toSignInputs: ToSignInput[] = [];

  // add asset
  tx.addInput(assetUtxo);
  toSignInputs.push({ index: 0, publicKey: assetUtxo.pubkey });
  tx.addOutput(toAddress, assetUtxo.satoshis);

  // add btc
  const _toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos, true);
  toSignInputs.push(..._toSignInputs);

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
