import { expect } from 'chai';
export async function expectThrowError(func, errorMsg) {
  let error;
  try {
    await func();
  } catch (e) {
    error = e;
  }
  expect(error).not.NaN;
  expect(error.message).to.eq(errorMsg);
}

import { scriptPkToAddress } from '../src/address';
import { bitcoin } from '../src/bitcoin-core';

export function printTx(rawtx: string) {
  const tx = bitcoin.Transaction.fromHex(rawtx);
  let ins = [];
  tx.ins.forEach((v) => {
    const txid = v.hash.reverse().toString('hex');
    const vout = v.index;
    ins.push({ txid, vout });
  });

  let outs = [];
  tx.outs.forEach((v) => {
    const address = scriptPkToAddress(v.script);
    const satoshis = v.value;
    outs.push({ address, satoshis });
  });

  let str = '\nPrint TX \n';
  str += `txid: ${tx.getId()}\n`;
  str += `\nInputs:(${ins.length})\n`;
  ins.forEach((v, index) => {
    str += `#${index} -- --\n`;
    str += `   ${v.txid} [${v.vout}]\n`;
  });

  str += `\nOutputs:(${outs.length})\n`;
  outs.forEach((v, index) => {
    str += `#${index} ${v.address} ${v.satoshis}\n`;
  });
  str += '\n';

  console.log(str);
}

export function printPsbt(psbtData: string | bitcoin.Psbt) {
  let psbt: bitcoin.Psbt;
  if (typeof psbtData == 'string') {
    psbt = bitcoin.Psbt.fromHex(psbtData);
  } else {
    psbt = psbtData;
  }
  let totalInput = 0;
  let totalOutput = 0;
  let str = '\nPSBT:\n';
  str += `Inputs:(${psbt.txInputs.length})\n`;
  psbt.txInputs.forEach((input, index) => {
    const inputData = psbt.data.inputs[index];
    str += `#${index} ${scriptPkToAddress(
      inputData.witnessUtxo.script.toString('hex')
    )} ${inputData.witnessUtxo.value}\n`;
    str += `   ${Buffer.from(input.hash).reverse().toString('hex')} [${input.index}]\n`;
    totalInput += inputData.witnessUtxo.value;
  });

  str += `Outputs:(${psbt.txOutputs.length} )\n`;
  psbt.txOutputs.forEach((output, index) => {
    if (output.address) {
      str += `#${index} ${output.address} ${output.value}\n`;
      totalOutput += output.value;
    } else {
      if (output.script[0] === 0x6a) {
        let opreutrnDataString = 'OP_RETURN ';
        let curScript = output.script.slice(1);
        while (curScript.length > 0) {
          const len = parseInt(curScript.slice(0, 1).toString('hex'), 16);
          opreutrnDataString += curScript.slice(1, len + 1).toString('hex') + ' ';
          curScript = curScript.slice(len + 1);
        }
        str += `#${index} ${opreutrnDataString} ${output.value}\n`;
      } else {
        str += `#${index} ${output.script.toString('hex')} ${output.value}\n`;
      }

      totalOutput += output.value;
    }
  });

  str += `Left: ${totalInput - totalOutput}\n`;
  try {
    const fee = psbt.getFee();
    const virtualSize = psbt.extractTransaction(true).virtualSize();
    const feeRate = fee / virtualSize;
    str += `Fee: ${fee}\n`;
    str += `FeeRate: ${feeRate}\n`;
    str += `VirtualSize: ${virtualSize}\n`;
  } catch (e) {
    // todo
  }

  str += '\n';
  console.log(str);
}
