import { Tapleaf, Taptree } from "bitcoinjs-lib/src/types";
import { expect } from "chai";
import { AddressType } from "../../src";
import { ECPair, bitcoin } from "../../src/bitcoin-core";
import { NetworkType } from "../../src/network";
import { toXOnly, validator } from "../../src/utils";
import { LocalWallet } from "../../src/wallet";

describe("sign transaction", function () {
  it("sign P2SH multisigAddress", async function () {
    const network = bitcoin.networks.testnet;

    const signer1 = ECPair.makeRandom({ network });
    const signer2 = ECPair.makeRandom({ network });
    const signer3 = ECPair.makeRandom({ network });

    const pubkeysHex = [
      signer1.publicKey.toString("hex"),
      signer2.publicKey.toString("hex"),
      signer3.publicKey.toString("hex"),
    ];
    const pubkeys = pubkeysHex.map((hex) => Buffer.from(hex, "hex"));
    const redeemScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_2,
      pubkeys[0],
      pubkeys[1],
      pubkeys[2],
      bitcoin.opcodes.OP_3,
      bitcoin.opcodes.OP_CHECKMULTISIG,
    ]);
    const multisigPayment = bitcoin.payments.p2sh({
      redeem: { output: redeemScript },
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from(
      "0000000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence);
    txToSpend.addOutput(multisigPayment.output, dummyValue);
    const txHex = txToSpend.toHex();
    const dummyUtxo = {
      txid: txToSpend.getId(),
      vout: 0,
      value: dummyValue,
      txHex,
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network,
    });

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      nonWitnessUtxo: Buffer.from(dummyUtxo.txHex, "hex"),
      redeemScript: redeemScript,
    });
    psbt.addOutput({
      script: multisigPayment.output,
      value: dummyUtxo.value - 1000,
    });

    const psbtB = psbt.clone();

    psbt.signInput(0, signer1);
    psbt.signInput(0, signer2);

    const valid = psbt.validateSignaturesOfAllInputs(validator);
    psbt.finalizeAllInputs();
    psbt.extractTransaction(true);

    expect(valid).to.be.true;

    // use wallet to sign
    const wallet1 = new LocalWallet(
      signer1.toWIF(),
      AddressType.P2WPKH,
      NetworkType.TESTNET
    );

    const wallet2 = new LocalWallet(
      signer2.toWIF(),
      AddressType.P2WPKH,
      NetworkType.TESTNET
    );
    await wallet1.signPsbt(psbtB, {
      toSignInputs: [{ index: 0, publicKey: wallet1.pubkey }],
    });
    await wallet2.signPsbt(psbtB, {
      toSignInputs: [{ index: 0, publicKey: wallet2.pubkey }],
    });
    const validB = psbtB.validateSignaturesOfAllInputs(validator);
    psbtB.finalizeAllInputs();
    psbtB.extractTransaction(true);
    expect(validB).to.be.true;
  });

  it("sign P2TR multisigAddress", async function () {
    const network = bitcoin.networks.testnet;

    const signer1 = ECPair.makeRandom({ network });
    const signer2 = ECPair.makeRandom({ network });
    const signer3 = ECPair.makeRandom({ network });

    const pubkeysHex = [
      signer1.publicKey.toString("hex"),
      signer2.publicKey.toString("hex"),
      signer3.publicKey.toString("hex"),
    ];
    const pubkeys = pubkeysHex.map((hex) => Buffer.from(hex, "hex"));

    const redeemScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_2,
      pubkeys[0],
      pubkeys[1],
      pubkeys[2],
      bitcoin.opcodes.OP_3,
      bitcoin.opcodes.OP_CHECKMULTISIG,
    ]);

    const tapLeaf: Tapleaf = {
      output: redeemScript,
      version: 192,
    };
    const tapTree: Taptree = tapLeaf;

    const multisigPayment = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(signer1.publicKey),
      scriptTree: tapTree,
      redeem: { output: redeemScript },
      network,
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from(
      "0000000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence);
    txToSpend.addOutput(multisigPayment.output, dummyValue);
    const txHex = txToSpend.toHex();
    const dummyUtxo = {
      txid: txToSpend.getId(),
      vout: 0,
      value: dummyValue,
      txHex,
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network,
    });

    const tapLeafScript = [
      {
        leafVersion: 192,
        script: tapLeaf.output,
        controlBlock:
          multisigPayment.witness![multisigPayment.witness!.length - 1],
      },
    ];

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      witnessUtxo: {
        value: dummyUtxo.value,
        script: multisigPayment.output,
      },
      tapLeafScript,
    });
    psbt.addOutput({
      script: multisigPayment.output,
      value: dummyUtxo.value - 1000,
    });

    const psbtB = psbt.clone();

    psbt.signInput(0, signer1);
    psbt.signInput(0, signer2);

    psbt.finalizeAllInputs();
    psbt.extractTransaction(true);

    // use wallet to sign
    const wallet1 = new LocalWallet(
      signer1.toWIF(),
      AddressType.P2WPKH,
      NetworkType.TESTNET
    );

    const wallet2 = new LocalWallet(
      signer2.toWIF(),
      AddressType.P2WPKH,
      NetworkType.TESTNET
    );
    await wallet1.signPsbt(psbtB, {
      toSignInputs: [
        { index: 0, publicKey: wallet1.pubkey, disableTweakSigner: true },
      ],
    });

    await wallet2.signPsbt(psbtB, {
      toSignInputs: [
        { index: 0, publicKey: wallet2.pubkey, disableTweakSigner: true },
      ],
    });

    psbtB.finalizeAllInputs();
    psbtB.extractTransaction(true);

    // todo
    // validate signature
  });
});
