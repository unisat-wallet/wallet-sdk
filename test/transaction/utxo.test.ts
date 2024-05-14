import { expect } from 'chai';
import { AddressType, UnspentOutput } from '../../src';
import { NetworkType } from '../../src/network';
import { utxoHelper } from '../../src/transaction/utxo';
import { LocalWallet } from '../../src/wallet';

describe('utxo', () => {
  const utxo_inscription: UnspentOutput = {
    txid: '',
    vout: 0,
    satoshis: 1000,
    scriptPk: '',
    pubkey: '',
    addressType: AddressType.P2TR,
    inscriptions: [
      {
        inscriptionId: '',
        inscriptionNumber: 100,
        offset: 0
      }
    ],
    atomicals: []
  };

  const utxo_atomicals_ft: UnspentOutput = {
    txid: '',
    vout: 0,
    satoshis: 1000,
    scriptPk: '',
    pubkey: '',
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: [
      {
        atomicalId: '',
        atomicalNumber: 100,
        type: 'FT',
        ticker: 'atom'
      }
    ]
  };

  const utxo_atomicals_nft: UnspentOutput = {
    txid: '',
    vout: 0,
    satoshis: 1000,
    scriptPk: '',
    pubkey: '',
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: [
      {
        atomicalId: '',
        atomicalNumber: 100,
        type: 'NFT'
      }
    ]
  };

  const utxo_btc: UnspentOutput = {
    txid: '',
    vout: 0,
    satoshis: 1000,
    scriptPk: '',
    pubkey: '',
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: []
  };

  beforeEach(() => {
    // todo
  });

  it('hasInscription', async function () {
    expect(utxoHelper.hasInscription([utxo_btc, utxo_atomicals_ft, utxo_atomicals_nft])).to.be.false;
    expect(utxoHelper.hasInscription([utxo_btc, utxo_atomicals_ft, utxo_atomicals_nft, utxo_inscription])).to.be.true;
  });

  it('hasAtomicalsFT', async function () {
    expect(utxoHelper.hasAtomicalsFT([utxo_btc, utxo_inscription, utxo_atomicals_nft])).to.be.false;
    expect(utxoHelper.hasAtomicalsFT([utxo_btc, utxo_inscription, utxo_atomicals_nft, utxo_atomicals_ft])).to.be.true;
  });

  it('hasAtomical', async function () {
    expect(utxoHelper.hasAtomicalsNFT([utxo_btc])).to.be.false;
    expect(utxoHelper.hasAtomicalsNFT([utxo_btc, utxo_atomicals_ft, utxo_inscription])).to.be.false;
    expect(utxoHelper.hasAtomicalsNFT([utxo_btc, utxo_atomicals_nft])).to.be.true;
  });

  it('getUtxoDust', function () {
    expect(utxoHelper.getUtxoDust(AddressType.M44_P2TR)).to.eq(330);
    expect(utxoHelper.getUtxoDust(AddressType.P2TR)).to.eq(330);

    expect(utxoHelper.getUtxoDust(AddressType.M44_P2WPKH)).to.eq(294);
    expect(utxoHelper.getUtxoDust(AddressType.P2WPKH)).to.eq(294);

    expect(utxoHelper.getUtxoDust(AddressType.P2PKH)).to.eq(546);
    expect(utxoHelper.getUtxoDust(AddressType.P2SH_P2WPKH)).to.eq(546);
    expect(utxoHelper.getUtxoDust(AddressType.P2SH)).to.eq(546);
    expect(utxoHelper.getUtxoDust(AddressType.P2WSH)).to.eq(546);
  });

  const networks = [
    NetworkType.MAINNET,
    NetworkType.TESTNET
    // NetworkType.REGTEST, not support
  ];
  const networkNames = ['MAINNET', 'TESTNET', 'REGTEST'];
  networks.forEach((networkType) => {
    describe('getAddressUtxoDust networkType: ' + networkNames[networkType], function () {
      it('should return dust for P2TR', function () {
        expect(
          utxoHelper.getAddressUtxoDust(LocalWallet.fromRandom(AddressType.P2TR, networkType).address, networkType)
        ).to.eq(330);
      });

      it('should return dust for P2WPKH', function () {
        expect(
          utxoHelper.getAddressUtxoDust(LocalWallet.fromRandom(AddressType.P2WPKH, networkType).address, networkType)
        ).to.eq(294);
      });

      it('should return dust for P2PKH', function () {
        expect(
          utxoHelper.getAddressUtxoDust(LocalWallet.fromRandom(AddressType.P2PKH, networkType).address, networkType)
        ).to.eq(546);
      });

      it('should return dust for P2SH_P2WPKH', function () {
        expect(
          utxoHelper.getAddressUtxoDust(
            LocalWallet.fromRandom(AddressType.P2SH_P2WPKH, networkType).address,
            networkType
          )
        ).to.eq(546);
      });
    });
  });
});
