import { addressToScriptPk } from '../address';
import { bitcoin } from '../bitcoin-core';
import { UTXO_DUST } from '../constants';
import { ErrorCodes, WalletUtilsError } from '../error';
import { NetworkType, toPsbtNetwork } from '../network';
import { AddressType, ToSignInput, UnspentOutput } from '../types';
import { toXOnly } from '../utils';
import { EstimateWallet } from '../wallet';
import { utxoHelper } from './utxo';
interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo?: { value: number; script: Buffer };
    tapInternalKey?: Buffer;
    nonWitnessUtxo?: Buffer;
  };
  utxo: UnspentOutput;
}

interface TxOutput {
  address?: string;
  script?: Buffer;
  value: number;
}

/**
 * Convert UnspentOutput to PSBT TxInput
 */
function utxoToInput(utxo: UnspentOutput, estimate?: boolean): TxInput {
  if (utxo.addressType === AddressType.P2TR || utxo.addressType === AddressType.M44_P2TR) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, 'hex')
      },
      tapInternalKey: toXOnly(Buffer.from(utxo.pubkey, 'hex'))
    };
    return {
      data,
      utxo
    };
  } else if (utxo.addressType === AddressType.P2WPKH || utxo.addressType === AddressType.M44_P2WPKH) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, 'hex')
      }
    };
    return {
      data,
      utxo
    };
  } else if (utxo.addressType === AddressType.P2PKH) {
    if (!utxo.rawtx || estimate) {
      const data = {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          value: utxo.satoshis,
          script: Buffer.from(utxo.scriptPk, 'hex')
        }
      };
      return {
        data,
        utxo
      };
    } else {
      const data = {
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.rawtx, 'hex')
      };
      return {
        data,
        utxo
      };
    }
  } else if (utxo.addressType === AddressType.P2SH_P2WPKH) {
    const redeemData = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(utxo.pubkey, 'hex')
    });
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, 'hex')
      },
      redeemScript: redeemData.output
    };
    return {
      data,
      utxo
    };
  }
}

/**
 * Transaction
 */
export class Transaction {
  private utxos: UnspentOutput[] = [];
  private inputs: TxInput[] = [];
  public outputs: TxOutput[] = [];
  private changeOutputIndex = -1;
  public changedAddress: string;
  private networkType: NetworkType;
  private feeRate: number;
  private enableRBF = true;
  private _cacheNetworkFee = 0;
  private _cacheBtcUtxos: UnspentOutput[] = [];
  private _cacheToSignInputs: ToSignInput[] = [];
  constructor() {}

  setNetworkType(network: NetworkType) {
    this.networkType = network;
  }

  setEnableRBF(enable: boolean) {
    this.enableRBF = enable;
  }

  setFeeRate(feeRate: number) {
    this.feeRate = feeRate;
  }

  setChangeAddress(address: string) {
    this.changedAddress = address;
  }

  addInput(utxo: UnspentOutput) {
    this.utxos.push(utxo);
    this.inputs.push(utxoToInput(utxo));
  }

  removeLastInput() {
    this.utxos = this.utxos.slice(0, -1);
    this.inputs = this.inputs.slice(0, -1);
  }

  getTotalInput() {
    return this.inputs.reduce((pre, cur) => pre + cur.utxo.satoshis, 0);
  }

  getTotalOutput() {
    return this.outputs.reduce((pre, cur) => pre + cur.value, 0);
  }

  getUnspent() {
    return this.getTotalInput() - this.getTotalOutput();
  }

  async calNetworkFee() {
    const psbt = await this.createEstimatePsbt();
    const txSize = psbt.extractTransaction(true).virtualSize();
    const fee = Math.ceil(txSize * this.feeRate);
    return fee;
  }

  addOutput(address: string, value: number) {
    this.outputs.push({
      address,
      value
    });
  }

  addOpreturn(data: Buffer[]) {
    const embed = bitcoin.payments.embed({ data });
    this.outputs.push({
      script: embed.output,
      value: 0
    });
  }

  addScriptOutput(script: Buffer, value: number) {
    this.outputs.push({
      script,
      value
    });
  }

  getOutput(index: number) {
    return this.outputs[index];
  }

  addChangeOutput(value: number) {
    this.outputs.push({
      address: this.changedAddress,
      value
    });
    this.changeOutputIndex = this.outputs.length - 1;
  }

  getChangeOutput() {
    return this.outputs[this.changeOutputIndex];
  }

  getChangeAmount() {
    const output = this.getChangeOutput();
    return output ? output.value : 0;
  }

  removeChangeOutput() {
    this.outputs.splice(this.changeOutputIndex, 1);
    this.changeOutputIndex = -1;
  }

  removeRecentOutputs(count: number) {
    this.outputs.splice(-count);
  }

  toPsbt() {
    const network = toPsbtNetwork(this.networkType);
    const psbt = new bitcoin.Psbt({ network });
    this.inputs.forEach((v, index) => {
      if (v.utxo.addressType === AddressType.P2PKH) {
        if (v.data.witnessUtxo) {
          //@ts-ignore
          psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
        }
      }
      psbt.data.addInput(v.data);
      if (this.enableRBF) {
        psbt.setInputSequence(index, 0xfffffffd);
      }
    });
    this.outputs.forEach((v) => {
      if (v.address) {
        psbt.addOutput({
          address: v.address,
          value: v.value
        });
      } else if (v.script) {
        psbt.addOutput({
          script: v.script,
          value: v.value
        });
      }
    });

    return psbt;
  }

  clone() {
    const tx = new Transaction();
    tx.setNetworkType(this.networkType);
    tx.setFeeRate(this.feeRate);
    tx.setEnableRBF(this.enableRBF);
    tx.setChangeAddress(this.changedAddress);
    tx.utxos = this.utxos.map((v) => Object.assign({}, v));
    tx.inputs = this.inputs.map((v) => v);
    tx.outputs = this.outputs.map((v) => v);
    return tx;
  }

  async createEstimatePsbt() {
    const estimateWallet = EstimateWallet.fromRandom(this.inputs[0].utxo.addressType, this.networkType);

    const scriptPk = addressToScriptPk(estimateWallet.address, this.networkType).toString('hex');

    const tx = this.clone();
    tx.utxos.forEach((v) => {
      v.pubkey = estimateWallet.pubkey;
      v.scriptPk = scriptPk;
    });

    tx.inputs = [];
    tx.utxos.forEach((v) => {
      const input = utxoToInput(v, true);
      tx.inputs.push(input);
    });
    const psbt = tx.toPsbt();

    const toSignInputs = tx.inputs.map((v, index) => ({
      index,
      publicKey: estimateWallet.pubkey
    }));

    await estimateWallet.signPsbt(psbt, {
      autoFinalized: true,
      toSignInputs: toSignInputs
    });
    return psbt;
  }

  private selectBtcUtxos() {
    const totalInput = this.getTotalInput();
    const totalOutput = this.getTotalOutput() + this._cacheNetworkFee;
    if (totalInput < totalOutput) {
      const { selectedUtxos, remainingUtxos } = utxoHelper.selectBtcUtxos(
        this._cacheBtcUtxos,
        totalOutput - totalInput
      );
      if (selectedUtxos.length == 0) {
        throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_BTC_UTXO);
      }
      selectedUtxos.forEach((v) => {
        this.addInput(v);
        this._cacheToSignInputs.push({
          index: this.inputs.length - 1,
          publicKey: v.pubkey
        });
        this._cacheNetworkFee += utxoHelper.getAddedVirtualSize(v.addressType) * this.feeRate;
      });
      this._cacheBtcUtxos = remainingUtxos;
      this.selectBtcUtxos();
    }
  }

  async addSufficientUtxosForFee(btcUtxos: UnspentOutput[], forceAsFee?: boolean) {
    if (btcUtxos.length > 0) {
      this._cacheBtcUtxos = btcUtxos;
      const dummyBtcUtxo = Object.assign({}, btcUtxos[0]);
      dummyBtcUtxo.satoshis = 2100000000000000;
      this.addInput(dummyBtcUtxo);
      this.addChangeOutput(0);

      const networkFee = await this.calNetworkFee();
      const dummyBtcUtxoSize = utxoHelper.getAddedVirtualSize(dummyBtcUtxo.addressType);
      this._cacheNetworkFee = networkFee - dummyBtcUtxoSize * this.feeRate;

      this.removeLastInput();

      this.selectBtcUtxos();
    } else {
      if (forceAsFee) {
        throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_BTC_UTXO);
      }
      if (this.getTotalInput() < this.getTotalOutput()) {
        throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_BTC_UTXO);
      }
      this._cacheNetworkFee = await this.calNetworkFee();
    }

    const changeAmount = this.getTotalInput() - this.getTotalOutput() - Math.ceil(this._cacheNetworkFee);
    if (changeAmount > UTXO_DUST) {
      this.removeChangeOutput();
      this.addChangeOutput(changeAmount);
    } else {
      this.removeChangeOutput();
    }

    return this._cacheToSignInputs;
  }

  async dumpTx(psbt) {
    const tx = psbt.extractTransaction();
    const feeRate = psbt.getFeeRate();

    console.log(`
=============================================================================================
Summary
  txid:     ${tx.getId()}
  Size:     ${tx.byteLength()}
  Fee Paid: ${psbt.getFee()}
  Fee Rate: ${feeRate} sat/vB
  Detail:   ${psbt.txInputs.length} Inputs, ${psbt.txOutputs.length} Outputs
----------------------------------------------------------------------------------------------
Inputs
${this.inputs
  .map((input, index) => {
    const str = `
=>${index} ${input.data.witnessUtxo.value} Sats
        lock-size: ${input.data.witnessUtxo.script.length}
        via ${input.data.hash} [${input.data.index}]
`;
    return str;
  })
  .join('')}
total: ${this.getTotalInput()} Sats
----------------------------------------------------------------------------------------------
Outputs
${this.outputs
  .map((output, index) => {
    const str = `
=>${index} ${output.address} ${output.value} Sats`;
    return str;
  })
  .join('')}

total: ${this.getTotalOutput()} Sats
=============================================================================================
    `);
  }
}
