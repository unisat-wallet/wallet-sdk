import { expect } from 'chai';
import { AddressType, UnspentOutput } from '../../src';
import { ErrorCodes } from '../../src/error';
import { NetworkType } from '../../src/network';
import { LocalWallet } from '../../src/wallet';
import { dummySendAllBTC, dummySendBTC, expectFeeRate, genDummyUtxo, genDummyUtxos } from './utils';

describe('sendBTC', () => {
  beforeEach(() => {
    // todo
  });

  const testAddressTypes = [
    AddressType.P2TR,
    AddressType.P2WPKH,
    AddressType.P2PKH,
    AddressType.P2SH_P2WPKH,
    AddressType.M44_P2TR, // deprecated
    AddressType.M44_P2WPKH // deprecated
  ];
  testAddressTypes.forEach((addressType) => {
    const fromWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);
    const toWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);

    describe('basic ' + addressType, function () {
      it('huge balance', async function () {
        const ret = await dummySendBTC({
          wallet: fromWallet,
          btcUtxos: [genDummyUtxo(fromWallet, 100000000)],
          tos: [{ address: toWallet.address, satoshis: 1000 }],
          feeRate: 1
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
        expect(ret.psbt.txOutputs[0].value).eq(1000);
      });

      it('send all balance', async function () {
        const ret = await dummySendAllBTC({
          wallet: fromWallet,
          toAddress: toWallet.address,
          btcUtxos: genDummyUtxos(fromWallet, [100000000, 100000000]),
          feeRate: 1
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(1);
        expectFeeRate(addressType, ret.feeRate, 1);
        expect(ret.psbt.txOutputs[0].address).eq(toWallet.address);
      });
    });

    describe('fee rate ' + addressType, function () {
      const feeRates = [1, 1.3, 10, 1000, 10000];
      feeRates.forEach((feeRate) => {
        it('feeRate=' + feeRate, async function () {
          const ret = await dummySendBTC({
            wallet: fromWallet,
            btcUtxos: [genDummyUtxo(fromWallet, 100000000)],
            tos: [{ address: toWallet.address, satoshis: 1000 }],
            feeRate
          });
          expect(ret.inputCount).eq(1);
          expect(ret.outputCount).eq(2);
          expectFeeRate(addressType, ret.feeRate, feeRate);
          expect(ret.psbt.txOutputs[0].value).eq(1000);
        });
      });
    });

    describe('select UTXO', function () {
      it('1 utxo', async function () {
        const ret = await dummySendBTC({
          wallet: fromWallet,
          btcUtxos: [genDummyUtxo(fromWallet, 100000000)],
          tos: [{ address: toWallet.address, satoshis: 1000 }],
          feeRate: 1
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('total 2 utxo but only use 1', async function () {
        const { inputCount, outputCount } = await dummySendBTC({
          wallet: fromWallet,
          btcUtxos: [genDummyUtxo(fromWallet, 10000), genDummyUtxo(fromWallet, 1000)],
          tos: [{ address: toWallet.address, satoshis: 1000 }],
          feeRate: 1
        });
        expect(inputCount).eq(1);
        expect(outputCount).eq(2);
        expectFeeRate(addressType, 1, 1);
      });

      it('total 3 utxo', async function () {
        const ret = await dummySendBTC({
          wallet: fromWallet,
          btcUtxos: genDummyUtxos(fromWallet, [5000, 5000, 10000]),
          tos: [{ address: toWallet.address, satoshis: 10000 }],
          feeRate: 1
        });
        expect(ret.inputCount).eq(3);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('insufficent balance', async function () {
        try {
          await dummySendBTC({
            wallet: fromWallet,
            btcUtxos: genDummyUtxos(fromWallet, [5000, 5000, 278]),
            tos: [{ address: toWallet.address, satoshis: 10000 }],
            feeRate: 1
          });
        } catch (e: any) {
          expect(e.code).eq(ErrorCodes.INSUFFICIENT_BTC_UTXO);
        }
      });
    });

    describe('send to multi receivers', function () {
      it('2 receivers', async function () {
        const ret = await dummySendBTC({
          wallet: fromWallet,
          tos: [
            {
              address: toWallet.address,
              satoshis: 1000
            },
            {
              address: toWallet.address,
              satoshis: 5000
            }
          ],
          btcUtxos: [genDummyUtxo(fromWallet, 10000)],
          feeRate: 1
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(3);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe('to many UTXO', function () {
      it('500 inputs => 2 outputs', async function () {
        const btcUtxos: UnspentOutput[] = [];
        for (let i = 0; i < 1000; i++) {
          btcUtxos.push(genDummyUtxo(fromWallet, 1000));
        }
        const ret = await dummySendBTC({
          wallet: fromWallet,
          btcUtxos,
          tos: [{ address: toWallet.address, satoshis: 1000 * 500 }],
          feeRate: 1
        });
        expect(ret.psbt.txOutputs[0].address).eq(toWallet.address);
        expect(ret.psbt.txOutputs[0].value).eq(1000 * 500);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe('send with memo', function () {
      it('allow hex and utf8 ', async function () {
        const ret1 = await dummySendBTC({
          wallet: fromWallet,
          tos: [
            {
              address: toWallet.address,
              satoshis: 1000
            }
          ],
          btcUtxos: [genDummyUtxo(fromWallet, 10000)],
          feeRate: 1,
          memo: Buffer.from('hello').toString('hex')
          // dump: true,
        });
        const data1 = ret1.psbt.txOutputs[1].script.toString('hex');
        expect(ret1.inputCount).eq(1);
        expect(ret1.outputCount).eq(3);
        expectFeeRate(addressType, ret1.feeRate, 1);

        const ret2 = await dummySendBTC({
          wallet: fromWallet,
          tos: [
            {
              address: toWallet.address,
              satoshis: 1000
            }
          ],
          btcUtxos: [genDummyUtxo(fromWallet, 10000)],
          feeRate: 1,
          memo: 'hello'
        });
        const data2 = ret2.psbt.txOutputs[1].script.toString('hex');
        expect(data1).eq(data2);
      });
    });

    describe('send with memos', function () {
      it('allow hex and utf8 ', async function () {
        const ret1 = await dummySendBTC({
          wallet: fromWallet,
          tos: [
            {
              address: toWallet.address,
              satoshis: 1000
            }
          ],
          btcUtxos: [genDummyUtxo(fromWallet, 10000)],
          feeRate: 1,
          memos: ['52554e455f54455354', '0083ed9fceff016401']
          // dump: true,
        });
        const data1 = ret1.psbt.txOutputs[1].script.toString('hex');
        expect(ret1.inputCount).eq(1);
        expect(ret1.outputCount).eq(3);
        expectFeeRate(addressType, ret1.feeRate, 1);
        expect(data1).eq('6a0952554e455f54455354090083ed9fceff016401');
      });
    });
  });

  describe('P2PKH', function () {
    const wallet_P2WPKH = LocalWallet.fromRandom(AddressType.P2WPKH, NetworkType.MAINNET);
    const wallet_P2PKH = LocalWallet.fromRandom(AddressType.P2PKH, NetworkType.MAINNET);

    it('use nonWitnessUtxo for P2PKH', async function () {
      const ret1 = await dummySendBTC({
        wallet: wallet_P2WPKH,
        btcUtxos: [genDummyUtxo(wallet_P2WPKH, 10000)],
        tos: [{ address: wallet_P2PKH.address, satoshis: 5000 }],
        feeRate: 1
      });
      const tx1 = ret1.psbt.extractTransaction();
      const ret2 = await dummySendBTC({
        wallet: wallet_P2PKH,
        btcUtxos: [
          {
            txid: tx1.getId(),
            vout: 0,
            satoshis: 5000,
            scriptPk: wallet_P2PKH.scriptPk,
            addressType: wallet_P2PKH.addressType,
            pubkey: wallet_P2PKH.pubkey,
            inscriptions: [],
            atomicals: [],
            rawtx: tx1.toHex()
          }
        ],
        tos: [{ address: wallet_P2PKH.address, satoshis: 3000 }],
        feeRate: 1
      });
      expect(ret2.feeRate).eq(1);
    });
  });
});
