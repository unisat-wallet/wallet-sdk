import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils';
import { Tapleaf, Taptree } from 'bitcoinjs-lib/src/types';
import { expect } from 'chai';
import { AddressType } from '../../src';
import { ECPair, bitcoin } from '../../src/bitcoin-core';
import { NetworkType } from '../../src/network';
import { toXOnly, tweakSigner, validator } from '../../src/utils';
import { LocalWallet } from '../../src/wallet';
const dummyWallets = {
  walletA: {
    wif: 'L2YD8KhXoBH3jZMgX4Kg9g4DiTTCaof631apfyP5KEghaVYRQav9',
    address: 'bc1pxlflugu5xtjnn9n4mut3cjjgsdnt5lzmgv2cmmqt9w55dp60r2cqurmcsg'
  },
  walletB: {
    wif: 'L1yEHuhg41KRFc7yynSr8jSn1DeXsMCuWuFoYL9JdtyfeZSyZ91V',
    address: 'bc1pnrcvs9cgejumjzn0pfn5qyhua2kn668h79222dft4h7y564awwws4qfc4j'
  },
  walletC: {
    wif: 'L2EY55FUjKiJQ5G6vtANJoHTMV6LBV4PQXJmfcJcgGNEV3hy3LTQ',
    address: 'bc1pysl52yv549l86lx623e2w95wsjw6j7tntaak7khkfa6vt6mewkeq8xura2'
  }
};

describe('sign transaction', function () {
  it('sign P2SH multisigAddress', async function () {
    const network = bitcoin.networks.testnet;

    const signer1 = ECPair.makeRandom({ network });
    const signer2 = ECPair.makeRandom({ network });
    const signer3 = ECPair.makeRandom({ network });

    const pubkeysHex = [
      signer1.publicKey.toString('hex'),
      signer2.publicKey.toString('hex'),
      signer3.publicKey.toString('hex')
    ];
    const pubkeys = pubkeysHex.map((hex) => Buffer.from(hex, 'hex'));
    const redeemScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_2,
      pubkeys[0],
      pubkeys[1],
      pubkeys[2],
      bitcoin.opcodes.OP_3,
      bitcoin.opcodes.OP_CHECKMULTISIG
    ]);
    const multisigPayment = bitcoin.payments.p2sh({
      redeem: { output: redeemScript }
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
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
      txHex
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network
    });

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      nonWitnessUtxo: Buffer.from(dummyUtxo.txHex, 'hex'),
      redeemScript: redeemScript
    });
    psbt.addOutput({
      script: multisigPayment.output,
      value: dummyUtxo.value - 1000
    });

    const psbtB = psbt.clone();

    psbt.signInput(0, signer1);
    psbt.signInput(0, signer2);

    const valid = psbt.validateSignaturesOfAllInputs(validator);
    psbt.finalizeAllInputs();
    psbt.extractTransaction(true);

    expect(valid).to.be.true;

    // use wallet to sign
    const wallet1 = new LocalWallet(signer1.toWIF(), AddressType.P2WPKH, NetworkType.TESTNET);

    const wallet2 = new LocalWallet(signer2.toWIF(), AddressType.P2WPKH, NetworkType.TESTNET);
    await wallet1.signPsbt(psbtB, {
      toSignInputs: [{ index: 0, publicKey: wallet1.pubkey }]
    });
    await wallet2.signPsbt(psbtB, {
      toSignInputs: [{ index: 0, publicKey: wallet2.pubkey }]
    });
    const validB = psbtB.validateSignaturesOfAllInputs(validator);
    psbtB.finalizeAllInputs();
    psbtB.extractTransaction(true);
    expect(validB).to.be.true;
  });

  it('sign P2TR script by internal key', async function () {
    const network = bitcoin.networks.bitcoin;

    const internalWallet = new LocalWallet(dummyWallets.walletA.wif, AddressType.P2TR, NetworkType.MAINNET);
    const userWallet = new LocalWallet(dummyWallets.walletB.wif, AddressType.P2TR, NetworkType.MAINNET);

    const redeemScript = bitcoin.script.compile([
      toXOnly(Buffer.from(userWallet.pubkey, 'hex')),
      bitcoin.opcodes.OP_CHECKSIG
    ]);

    const tapLeaf: Tapleaf = {
      output: redeemScript,
      version: 192
    };
    const tapTree: Taptree = tapLeaf;

    const scriptPayment = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(Buffer.from(internalWallet.pubkey, 'hex')),
      scriptTree: tapTree,
      redeem: { output: redeemScript },
      network
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence);
    txToSpend.addOutput(scriptPayment.output, dummyValue);
    const txHex = txToSpend.toHex();
    let dummyUtxo = {
      txid: txToSpend.getId(),
      vout: 0,
      value: dummyValue,
      txHex
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network
    });

    const tapLeafScript = [
      {
        leafVersion: 192,
        script: tapLeaf.output,
        controlBlock: scriptPayment.witness![scriptPayment.witness!.length - 1]
      }
    ];

    // dummyUtxo = {
    //   txid: '',
    //   vout: 0,
    //   value: 2000,
    //   txHex: ''
    // };

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      witnessUtxo: {
        value: dummyUtxo.value,
        script: scriptPayment.output
      },
      tapLeafScript,
      sighashType: 1
    });
    psbt.addOutput({
      script: scriptPayment.output,
      value: dummyUtxo.value - 500
    });

    // printPsbt(psbt);
    // console.log(multisigPayment.address);
    // // use wallet to sign

    await userWallet.signPsbt(psbt, {
      toSignInputs: [{ index: 0, publicKey: userWallet.pubkey, disableTweakSigner: true, sighashTypes: [1] }]
    });

    const validated = psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
      return ECPair.fromPublicKey(Buffer.from(userWallet.pubkey, 'hex'), {}).verifySchnorr(msghash, signature);
    });
    expect(validated).to.be.true;

    psbt.finalizeAllInputs();
    // const tx = psbt.extractTransaction(true);
    // console.log(tx.toHex());
  });

  it('sign P2TR script by tweaked key', async function () {
    const network = bitcoin.networks.bitcoin;

    const internalWallet = new LocalWallet(dummyWallets.walletA.wif, AddressType.P2TR, NetworkType.MAINNET);
    const userWallet = new LocalWallet(dummyWallets.walletB.wif, AddressType.P2TR, NetworkType.MAINNET);
    const userTweakedSigner = tweakSigner(ECPair.fromWIF(dummyWallets.walletB.wif, network));
    const tweakedPubkey = userTweakedSigner.publicKey;

    const redeemScript = bitcoin.script.compile([toXOnly(tweakedPubkey), bitcoin.opcodes.OP_CHECKSIG]);

    const tapLeaf: Tapleaf = {
      output: redeemScript,
      version: 192
    };
    const tapTree: Taptree = tapLeaf;

    const scriptPayment = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(Buffer.from(internalWallet.pubkey, 'hex')),
      scriptTree: tapTree,
      redeem: { output: redeemScript },
      network
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence);
    txToSpend.addOutput(scriptPayment.output, dummyValue);
    const txHex = txToSpend.toHex();
    let dummyUtxo = {
      txid: txToSpend.getId(),
      vout: 0,
      value: dummyValue,
      txHex
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network
    });

    const tapLeafScript = [
      {
        leafVersion: 192,
        script: tapLeaf.output,
        controlBlock: scriptPayment.witness![scriptPayment.witness!.length - 1]
      }
    ];

    // test on chain
    // dummyUtxo = {
    //   txid: '',
    //   vout: 0,
    //   value: 2000,
    //   txHex: ''
    // };

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      witnessUtxo: {
        value: dummyUtxo.value,
        script: scriptPayment.output
      },
      tapLeafScript,
      sighashType: 1
    });
    psbt.addOutput({
      script: scriptPayment.output,
      value: dummyUtxo.value - 500
    });

    await userWallet.signPsbt(psbt, {
      toSignInputs: [{ index: 0, publicKey: userWallet.pubkey, disableTweakSigner: false, sighashTypes: [1] }]
    });

    const validated = psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
      return ECPair.fromPublicKey(tweakedPubkey, {}).verifySchnorr(msghash, signature);
    });
    expect(validated).to.be.true;

    psbt.finalizeAllInputs();
    // const tx = psbt.extractTransaction(true);
    // console.log(tx.toHex());
  });

  // https://mempool-testnet.fractalbitcoin.io/tx/bc7e18e6626dc11cfeed6b570af67c9eb59e4039c39a0a05a7557ed6a4e93982
  it('sign P2TR script without pubkey by tweaked key', async function () {
    const network = bitcoin.networks.bitcoin;

    const internalWallet = new LocalWallet(dummyWallets.walletA.wif, AddressType.P2TR, NetworkType.MAINNET);
    const userWallet = new LocalWallet(dummyWallets.walletB.wif, AddressType.P2TR, NetworkType.MAINNET);
    const userTweakedSigner = tweakSigner(ECPair.fromWIF(dummyWallets.walletB.wif, network));
    const tweakedPubkey = userTweakedSigner.publicKey;

    const redeemScript = bitcoin.script.compile([bitcoin.opcodes.OP_CHECKSIG]);

    const tapLeaf: Tapleaf = {
      output: redeemScript,
      version: 192
    };
    const tapTree: Taptree = tapLeaf;

    const scriptPayment = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(Buffer.from(internalWallet.pubkey, 'hex')),
      scriptTree: tapTree,
      redeem: { output: redeemScript },
      network
    });

    const dummyValue = 10000;
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence);
    txToSpend.addOutput(scriptPayment.output, dummyValue);
    const txHex = txToSpend.toHex();
    let dummyUtxo = {
      txid: txToSpend.getId(),
      vout: 0,
      value: dummyValue,
      txHex
    };

    const psbt: bitcoin.Psbt = new bitcoin.Psbt({
      network
    });

    const tapLeafScript = [
      {
        leafVersion: 192,
        script: tapLeaf.output,
        controlBlock: scriptPayment.witness![scriptPayment.witness!.length - 1]
      }
    ];

    // console.log(scriptPayment.address);
    // test on chain
    // dummyUtxo = {
    //   txid: '',
    //   vout: 0,
    //   value: 2000,
    //   txHex: ''
    // };

    psbt.addInput({
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      witnessUtxo: {
        value: dummyUtxo.value,
        script: scriptPayment.output
      },
      tapLeafScript,
      sighashType: 1
    });
    psbt.addOutput({
      script: scriptPayment.output,
      value: dummyUtxo.value - 500
    });

    await userWallet.signPsbt(psbt, {
      toSignInputs: [{ index: 0, publicKey: userWallet.pubkey, disableTweakSigner: false, sighashTypes: [1] }]
    });

    const validated = psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
      return ECPair.fromPublicKey(tweakedPubkey, {}).verifySchnorr(msghash, signature);
    });
    expect(validated).to.be.true;

    const input = psbt.data.inputs[0];
    const finalScriptWitness = witnessStackToScriptWitness([
      input.tapScriptSig[0].signature,
      toXOnly(tweakedPubkey),
      input.tapLeafScript[0].script,
      input.tapLeafScript[0].controlBlock
    ]);
    psbt.finalizeAllInputs();
    psbt.data.inputs[0].finalScriptWitness = finalScriptWitness;
    // const tx = psbt.extractTransaction(true);
    // console.log(tx.toHex());
  });
});
