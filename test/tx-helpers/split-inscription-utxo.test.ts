import { expect } from 'chai';
import { AddressType } from '../../src';
import { ErrorCodes } from '../../src/error';
import { NetworkType } from '../../src/network';
import { LocalWallet } from '../../src/wallet';
import { dummySplitOrdUtxo, expectFeeRate, genDummyUtxo } from './utils';

describe('splitOrdUtxo', () => {
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

    describe('basic', function () {
      it('split UTXO containing one inscription', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: '001', offset: 1000 }]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(1);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('split UTXO containing two inscriptions', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [
              { inscriptionId: '001', offset: 1000 },
              { inscriptionId: '002', offset: 3000 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('split UTXO containing six inscriptions', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [
              { inscriptionId: '001', offset: 1000 },
              { inscriptionId: '002', offset: 1000 },
              { inscriptionId: '003', offset: 3000 },
              { inscriptionId: '004', offset: 4000 },
              { inscriptionId: '005', offset: 5000 },
              { inscriptionId: '006', offset: 10000 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(5);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe('custom output value', function () {
      it('split UTXO containing one inscription', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: '001', offset: 1000 }]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
          outputValue: 600
        });
        expect(ret.splitedCount).eq(1);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('split UTXO containing two inscriptions', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [
              { inscriptionId: '001', offset: 1000 },
              { inscriptionId: '002', offset: 3000 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
          outputValue: 600
        });
        expect(ret.splitedCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('split UTXO containing three inscriptions', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 1638, {
            inscriptions: [
              { inscriptionId: '001', offset: 0 },
              { inscriptionId: '002', offset: 546 },
              { inscriptionId: '003', offset: 1092 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
          outputValue: 600
        });
        expect(ret.splitedCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe('boundary cases', function () {
      it('The ord is in the last sat', async function () {
        try {
          await dummySplitOrdUtxo({
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: '001', offset: 10000 }]
            }),
            btcWallet: fromBtcWallet,
            btcUtxos: [],
            feeRate: 1
          });
        } catch (e) {
          expect(e.code).eq(ErrorCodes.INSUFFICIENT_BTC_UTXO);
        }
      });

      it('The ord is in the last sat', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: '001', offset: 10000 }]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(1);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('Two ord within 546', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [
              { inscriptionId: '001', offset: 0 },
              { inscriptionId: '002', offset: 1 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(1);
        // expectFeeRate(addressType, ret.feeRate, 1);
      });

      it('The ord is in the last sat', async function () {
        try {
          await dummySplitOrdUtxo({
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: '001', offset: 10000 }]
            }),
            btcWallet: fromBtcWallet,
            btcUtxos: [],
            feeRate: 1
          });
        } catch (e) {
          expect(e.code).eq(ErrorCodes.INSUFFICIENT_BTC_UTXO);
        }
      });

      it('split UTXO containing two adjacent inscriptions (not support)', async function () {
        const ret = await dummySplitOrdUtxo({
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 546, {
            inscriptions: [
              { inscriptionId: '001', offset: 0 },
              { inscriptionId: '002', offset: 200 }
            ]
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1
        });
        expect(ret.splitedCount).eq(1);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });
  });
});
