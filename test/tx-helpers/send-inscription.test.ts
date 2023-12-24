import { expect } from "chai";
import { AddressType } from "../../src";
import { ErrorCodes } from "../../src/error";
import { NetworkType } from "../../src/network";
import { LocalWallet } from "../../src/wallet";
import {
  dummySendInscription,
  expectFeeRate,
  genDummyUtxo,
  genDummyUtxos,
} from "./utils";

describe("sendInscription", () => {
  beforeEach(() => {
    // todo
  });

  const testAddressTypes = [
    AddressType.P2TR,
    // AddressType.P2SH_P2WPKH,
    // AddressType.P2PKH,
    // AddressType.P2SH_P2WPKH,
    // AddressType.M44_P2TR, // deprecated
    // AddressType.M44_P2WPKH, // deprecated
  ];
  testAddressTypes.forEach((addressType) => {
    const fromBtcWallet = LocalWallet.fromRandom(
      addressType,
      NetworkType.MAINNET
    );
    const fromAssetWallet = LocalWallet.fromRandom(
      addressType,
      NetworkType.MAINNET
    );

    const toWallet = LocalWallet.fromRandom(addressType, NetworkType.MAINNET);

    describe("basic " + addressType, function () {
      it("send one inscription with lower outputValue", async function () {
        const ret = await dummySendInscription({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: "001", offset: 1000 }],
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
          outputValue: 2000,
          feeRate: 1,
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it("send one inscription with higher outputValue", async function () {
        const ret = await dummySendInscription({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 1000, {
            inscriptions: [{ inscriptionId: "001", offset: 0 }],
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          outputValue: 2000,
          feeRate: 1,
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe("select UTXO", function () {
      it("total 4 UTXO but only use 1", async function () {
        const ret = await dummySendInscription({
          toAddress: toWallet.address,
          btcWallet: fromBtcWallet,
          btcUtxos: genDummyUtxos(fromBtcWallet, [1000, 1000, 1000]),
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: "001", offset: 1000 }],
          }),
          outputValue: 2000,
          feeRate: 1,
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });

    describe("inscription maybe lost", function () {
      it("safe outputvalue", async function () {
        const ret = await dummySendInscription({
          toAddress: toWallet.address,
          btcWallet: fromBtcWallet,
          btcUtxos: genDummyUtxos(fromBtcWallet, [10000]),
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
            inscriptions: [{ inscriptionId: "001", offset: 1000 }],
          }),
          outputValue: 1001,
          feeRate: 1,
        });
        expect(ret.inputCount).eq(1);
        expect(ret.outputCount).eq(2);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it("low outputvalue", async function () {
        let error: any = {};
        try {
          const ret = await dummySendInscription({
            toAddress: toWallet.address,
            btcWallet: fromBtcWallet,
            btcUtxos: genDummyUtxos(fromBtcWallet, [10000]),
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
              inscriptions: [{ inscriptionId: "001", offset: 1000 }],
            }),
            outputValue: 1000,
            feeRate: 1,
          });
        } catch (e) {
          error = e;
        }
        expect(error.code).eq(ErrorCodes.ASSET_MAYBE_LOST);
      });
    });
  });
});
