import { expect } from "chai";
import { AddressType } from "../../src";
import { NetworkType } from "../../src/network";
import { LocalWallet } from "../../src/wallet";
import { dummySendRunes, expectFeeRate, genDummyUtxo } from "./utils";

describe("send runes", () => {
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
      it("send runes", async function () {
        const ret = await dummySendRunes({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 546, {
            runes: [
              {
                runeid: "1000:10",
                amount: "100",
              },
            ],
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
          runeid: "1000:10",
          runeAmount: "100",
          outputValue: 546,
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(3);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it("send runes with changed", async function () {
        const ret = await dummySendRunes({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 546, {
            runes: [
              {
                runeid: "1000:10",
                amount: "200",
              },
            ],
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 10000)],
          feeRate: 1,
          runeid: "1000:10",
          runeAmount: "100",
          outputValue: 546,
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(4);
        expectFeeRate(addressType, ret.feeRate, 1);
      });
    });
  });
});
