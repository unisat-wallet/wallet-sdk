import { expect } from 'chai';
import { AddressType } from '../../src';
import { NetworkType } from '../../src/network';
import { LocalWallet } from '../../src/wallet';

const sampleMnemonic = 'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango';

describe('local-wallet', () => {
  describe('new a wallet', function () {
    it('fromMnemonic', function () {
      expect(
        LocalWallet.fromMnemonic(AddressType.P2TR, NetworkType.TESTNET, sampleMnemonic, '', "m/86'/0'/0'/0").address
      ).to.equal('tb1pa8m3gnwruyemrnc0q73lts3gw249xvd5956cqfxc45zjhhd6mmss2vjzut');

      expect(
        LocalWallet.fromMnemonic(AddressType.P2WPKH, NetworkType.TESTNET, sampleMnemonic, '', "m/84'/0'/0'/0").address
      ).to.equal('tb1qrzx25ehct2va5tmr2kcrpk2p50edk2cm5shn5w');
    });
  });
});
