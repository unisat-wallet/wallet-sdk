import { expect } from 'chai';
import { AddressType } from '../../src';
import { ErrorCodes } from '../../src/error';
import { NetworkType } from '../../src/network';
import { LocalWallet } from '../../src/wallet';
import { dummySendAtomicalsFT, expectFeeRate, genDummyAtomicalsFT, genDummyUtxo } from './utils';

describe('send atomicals FT', () => {
  beforeEach(() => {
    // todo
  });

  const testAddressTypes = [
    AddressType.P2TR,
    AddressType.P2SH_P2WPKH,
    AddressType.P2PKH,
    AddressType.P2SH_P2WPKH,
    AddressType.M44_P2TR, // deprecated
    AddressType.M44_P2WPKH // deprecated
  ];
  testAddressTypes.forEach((addressType) => {
    const fromBtcWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);
    const fromAssetWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);

    const toWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);

    describe('basic ' + addressType, function () {
      it('send atomicals ft', async function () {
        const ret = await dummySendAtomicalsFT({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 1000, {
            atomicals: [genDummyAtomicalsFT('atom', 1000)]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
          feeRate: 1,
          sendAmount: 500
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(3);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('require btc utxos', async function () {
        let error: any = null;
        try {
          await dummySendAtomicalsFT({
            toAddress: toWallet.address,
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
              atomicals: [genDummyAtomicalsFT('atom', 1000)]
            }),
            btcWallet: fromBtcWallet,
            btcUtxos: [],
            feeRate: 1,
            dump: true,
            sendAmount: 500
          });
        } catch (e) {
          error = e;
        }
        expect(error.code).eq(ErrorCodes.INSUFFICIENT_BTC_UTXO);
      });

      it('only one kind of arc20 can be send', async function () {
        let error: any = null;
        try {
          await dummySendAtomicalsFT({
            toAddress: toWallet.address,
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 1000, {
              atomicals: [genDummyAtomicalsFT('atom1', 800), genDummyAtomicalsFT('atom2', 800)]
            }),
            btcWallet: fromBtcWallet,
            btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
            feeRate: 1,
            sendAmount: 500
          });
        } catch (e) {
          error = e;
        }

        expect(error.code).eq(ErrorCodes.ONLY_ONE_ARC20_CAN_BE_SENT);
      });

      it('partial coloring', async function () {
        const ret = await dummySendAtomicalsFT({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            atomicals: [genDummyAtomicalsFT('atom', 5000)]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
          feeRate: 1,
          sendAmount: 800
        });

        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(3);
        expect(ret.psbt.txOutputs[1].value).eq(4200);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('partial coloring', async function () {
        const ret = await dummySendAtomicalsFT({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            atomicals: [genDummyAtomicalsFT('atom', 5000)]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
          feeRate: 1,
          sendAmount: 800
        });

        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(3);
        expect(ret.psbt.txOutputs[0].value).eq(800);
        expect(ret.psbt.txOutputs[1].value).eq(4200);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });
  });
});
