import { ErrorCodes, WalletUtilsError } from '../error';
import { NetworkType } from '../network';
import { Transaction } from '../transaction/transaction';
import { utxoHelper } from '../transaction/utxo';
import { UnspentOutput } from '../types';

export async function sendInscription({
  assetUtxo,
  btcUtxos,
  toAddress,
  networkType,
  changeAddress,
  feeRate,
  outputValue,
  enableRBF = true,
  enableMixed = false
}: {
  assetUtxo: UnspentOutput;
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: NetworkType;
  changeAddress: string;
  feeRate: number;
  outputValue: number;
  enableRBF?: boolean;
  enableMixed?: boolean;
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (utxoHelper.hasAtomicals([assetUtxo])) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (!enableMixed && assetUtxo.inscriptions.length !== 1) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const maxOffset = assetUtxo.inscriptions.reduce((pre, cur) => {
    return Math.max(pre, cur.offset);
  }, 0);

  if (outputValue - 1 < maxOffset) {
    throw new WalletUtilsError(ErrorCodes.ASSET_MAYBE_LOST);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  tx.addInput(assetUtxo);
  tx.addOutput(toAddress, outputValue);

  const toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos);
  toSignInputs.push({
    index: 0,
    publicKey: assetUtxo.pubkey
  });

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
