import bigInt from 'big-integer';
import { bitcoin } from '../bitcoin-core';
import { ErrorCodes, WalletUtilsError } from '../error';
import { NetworkType } from '../network';
import { varint } from '../runes';
import { RuneId } from '../runes/rund_id';
import { Transaction } from '../transaction/transaction';
import { utxoHelper } from '../transaction/utxo';
import { ToSignInput, UnspentOutput } from '../types';

// only one arc20 can be send
export async function sendRunes({
  assetUtxos,
  btcUtxos,
  assetAddress,
  btcAddress,
  toAddress,
  networkType,
  runeid,
  runeAmount,
  outputValue,
  feeRate,
  enableRBF = true
}: {
  assetUtxos: UnspentOutput[];
  btcUtxos: UnspentOutput[];
  assetAddress: string;
  btcAddress: string;
  toAddress: string;
  networkType: NetworkType;
  runeid: string;
  runeAmount: string;
  outputValue: number;
  feeRate: number;
  enableRBF?: boolean;
}) {
  // safe check
  if (utxoHelper.hasAtomicalsNFT(assetUtxos) || utxoHelper.hasInscription(assetUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction();
  tx.setNetworkType(networkType);
  tx.setFeeRate(feeRate);
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(btcAddress);

  const toSignInputs: ToSignInput[] = [];

  // add assets
  assetUtxos.forEach((v, index) => {
    tx.addInput(v);
    toSignInputs.push({ index, publicKey: v.pubkey });
  });

  let fromRuneAmount = bigInt(0);
  let hasMultipleRunes = false;
  let runesMap = {};
  assetUtxos.forEach((v) => {
    if (v.runes) {
      v.runes.forEach((w) => {
        runesMap[w.runeid] = true;
        if (w.runeid === runeid) {
          fromRuneAmount = fromRuneAmount.plus(bigInt(w.amount));
        }
      });
    }
  });

  if (Object.keys(runesMap).length > 1) {
    hasMultipleRunes = true;
  }

  const changedRuneAmount = fromRuneAmount.minus(bigInt(runeAmount));

  if (changedRuneAmount.lt(0)) {
    throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_ASSET_UTXO);
  }

  let needChange = false;
  if (hasMultipleRunes || changedRuneAmount.gt(0)) {
    needChange = true;
  }

  let payload = [];
  let runeId: RuneId = RuneId.fromString(runeid);

  varint.encodeToVec(0, payload);

  // add send data
  varint.encodeToVec(runeId.block, payload);
  varint.encodeToVec(runeId.tx, payload);
  varint.encodeToVec(runeAmount, payload);
  if (needChange) {
    // 1 is to change
    // 2 is to send
    varint.encodeToVec(2, payload);
  } else {
    // 1 is to send
    varint.encodeToVec(1, payload);
  }

  // add op_return
  tx.addScriptOutput(
    // OUTPUT_0
    bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, bitcoin.opcodes.OP_13, Buffer.from(new Uint8Array(payload))]),
    0
  );

  if (needChange) {
    // OUTPUT_1
    // add change
    tx.addOutput(assetAddress, outputValue);
  }

  tx.addOutput(toAddress, outputValue);

  // add btc
  const _toSignInputs = await tx.addSufficientUtxosForFee(btcUtxos, true);
  toSignInputs.push(..._toSignInputs);

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
