import { expect } from "chai";
import { AddressType, UnspentOutput } from "../../src";
import { utxoHelper } from "../../src/transaction/utxo";

describe("utxo", () => {
  const utxo_inscription: UnspentOutput = {
    txid: "",
    vout: 0,
    satoshis: 1000,
    scriptPk: "",
    pubkey: "",
    addressType: AddressType.P2TR,
    inscriptions: [
      {
        inscriptionId: "",
        inscriptionNumber: 100,
        offset: 0,
      },
    ],
    atomicals: [],
  };

  const utxo_atomicals_ft: UnspentOutput = {
    txid: "",
    vout: 0,
    satoshis: 1000,
    scriptPk: "",
    pubkey: "",
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: [
      {
        atomicalId: "",
        atomicalNumber: 100,
        type: "FT",
        ticker: "atom",
      },
    ],
  };

  const utxo_atomicals_nft: UnspentOutput = {
    txid: "",
    vout: 0,
    satoshis: 1000,
    scriptPk: "",
    pubkey: "",
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: [
      {
        atomicalId: "",
        atomicalNumber: 100,
        type: "NFT",
      },
    ],
  };

  const utxo_btc: UnspentOutput = {
    txid: "",
    vout: 0,
    satoshis: 1000,
    scriptPk: "",
    pubkey: "",
    addressType: AddressType.P2TR,
    inscriptions: [],
    atomicals: [],
  };

  beforeEach(() => {
    // todo
  });

  it("hasInscription", async function () {
    expect(
      utxoHelper.hasInscription([
        utxo_btc,
        utxo_atomicals_ft,
        utxo_atomicals_nft,
      ])
    ).to.be.false;
    expect(
      utxoHelper.hasInscription([
        utxo_btc,
        utxo_atomicals_ft,
        utxo_atomicals_nft,
        utxo_inscription,
      ])
    ).to.be.true;
  });

  it("hasAtomicalsFT", async function () {
    expect(
      utxoHelper.hasAtomicalsFT([
        utxo_btc,
        utxo_inscription,
        utxo_atomicals_nft,
      ])
    ).to.be.false;
    expect(
      utxoHelper.hasAtomicalsFT([
        utxo_btc,
        utxo_inscription,
        utxo_atomicals_nft,
        utxo_atomicals_ft,
      ])
    ).to.be.true;
  });

  it("hasAtomical", async function () {
    expect(utxoHelper.hasAtomicalsNFT([utxo_btc])).to.be.false;
    expect(
      utxoHelper.hasAtomicalsNFT([
        utxo_btc,
        utxo_atomicals_ft,
        utxo_inscription,
      ])
    ).to.be.false;
    expect(utxoHelper.hasAtomicalsNFT([utxo_btc, utxo_atomicals_nft])).to.be
      .true;
  });
});
