import { expect } from 'chai';
import { KeystoneKeyring } from '../../src/keyring';

const initOpts = {
  mfp: '52744703',
  keys: [
    {
      path: "m/44'/0'/0'",
      extendedPublicKey:
        'xpub6CWL8m4zcbAPXjWkfFWkyjkorenkhBV8P6VFFCmoMn9WZZZhC3ehf7jovLr5HYXGnHZXZbEBFCWo6KqZiqzaV1gMMc5fdprGiWiaA6vynpA'
    },
    {
      path: "m/49'/0'/0'",
      extendedPublicKey:
        'xpub6CK8ZyoANWjWk24vmGhZ3V5x28QinZ3C66P3es5oDgtrvZLDK8txJHXu88zKsGc3WA7HFUDPHYcoWir4j2cMNMKBBhfHCB37StVhxozA5Lp'
    },
    {
      path: "m/84'/0'/0'",
      extendedPublicKey:
        'xpub6CcBrNAXBhrdb29q4BFApXgKgCdnHevzGnwFKnDSYfWWMcqkbH17ay6vaUJDZxFdZx5y5AdcoEzLfURSdwtQEEZ93Y5VXUSJ9S8hm5SY7Si'
    },
    {
      path: "m/86'/0'/0'",
      extendedPublicKey:
        'xpub6Cq9mdT8xwFe9LYQnt9y1hJXTyo7KQJM8pRH6K95F1mbELzgm825m3hyAZ97vsUV8Xh7VRwu7bKuLZEmUV1ABqCRQqFzZHAsfaJXTYSY1cf'
    }
  ],
  hdPath: "m/44'/0'/0'",
  activeIndexes: [0, 1]
};

const firstAccount = {
  index: 0,
  path: "m/44'/0'/0'/0/0",
  publicKey: '03595bab1a88ddd75f04205b8533cd8d1ce2b2a24ebe164d6ad6a1f4945aed3f99'
};
const secondAccount = {
  index: 1,
  path: "m/44'/0'/0'/0/1",
  publicKey: '02aea7c5fa9074943e0821d7db0f2a2114a8694a9a24237e8a452056340d47c0f3'
};

describe('bitcoin-keystone-keyring', () => {
  describe('constructor', () => {
    it('constructs', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      const accounts = await keyring.getAccounts();

      expect(accounts).deep.eq([firstAccount.publicKey, secondAccount.publicKey]);
    });
  });

  describe('init', () => {
    it('init from UR', async () => {
      const keyring = new KeystoneKeyring();

      await keyring.initFromUR(
        'crypto-account',
        'a2011a527447030284d90194d9012fa702f40358210238506dbd94e82166cb68536ffa0d0e145fcb87b975d9dbd0475fdb664f3daea6045820399c9a9c6b98711235a2484f8e44cbb5f1e656306ae15a0bb29a0d7ed227f0a805d90131a20100020006d90130a301861854f500f500f5021a52744703030307d90130a2018400f480f40300081a81ff3431d90193d9012fa702f403582103ebd552027b73adb1de1aa494ca7cedfe781434d6f102a55355b118a0c5da78bc045820517438aec2b78e81c275a41be63df6083358070cbefdb59de69bd2f99c003e8a05d90131a20100020006d90130a30186182cf500f500f5021a52744703030307d90130a2018400f480f40300081a7441f35cd90190d90194d9012fa702f403582102f3b97cf3f3387e2c4d8c7141a21529a90e0585e9f032706798d18f988a56e3f1045820ac31dee4dd3f4632f984e0a41e8728edc3ec67f614c8f03181490c8945d19d7405d90131a20100020006d90130a301861831f500f500f5021a52744703030307d90130a2018400f480f40300081a59fcb265d90199d9012fa702f4035821026c395e1763f5a6f07ade3557429c4bdab45d5487599ed283e78534ac1816408f045820af3a23ef7b1a54d3dbdb6c3e502382e55de5ff575f13ceacf52be01be37c0b4405d90131a20100020006d90130a301861856f500f500f5021a52744703030307d90130a2018400f480f40300081aa0682b01'
      );
      const opts = await keyring.serialize();

      expect(opts).deep.eq({
        mfp: '52744703',
        keys: [
          {
            path: "m/84'/0'/0'",
            extendedPublicKey:
              'xpub6CcBrNAXBhrdb29q4BFApXgKgCdnHevzGnwFKnDSYfWWMcqkbH17ay6vaUJDZxFdZx5y5AdcoEzLfURSdwtQEEZ93Y5VXUSJ9S8hm5SY7Si'
          },
          {
            path: "m/44'/0'/0'",
            extendedPublicKey:
              'xpub6CWL8m4zcbAPXjWkfFWkyjkorenkhBV8P6VFFCmoMn9WZZZhC3ehf7jovLr5HYXGnHZXZbEBFCWo6KqZiqzaV1gMMc5fdprGiWiaA6vynpA'
          },
          {
            path: "m/49'/0'/0'",
            extendedPublicKey:
              'xpub6CK8ZyoANWjWk24vmGhZ3V5x28QinZ3C66P3es5oDgtrvZLDK8txJHXu88zKsGc3WA7HFUDPHYcoWir4j2cMNMKBBhfHCB37StVhxozA5Lp'
          },
          {
            path: "m/86'/0'/0'",
            extendedPublicKey:
              'xpub6Cq9mdT8xwFe9LYQnt9y1hJXTyo7KQJM8pRH6K95F1mbELzgm825m3hyAZ97vsUV8Xh7VRwu7bKuLZEmUV1ABqCRQqFzZHAsfaJXTYSY1cf'
          }
        ],
        hdPath: "m/44'/0'/0'/0",
        activeIndexes: []
      });
    });
  });

  describe('manage accounts', () => {
    it('add a single account', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      await keyring.addAccounts(1);

      expect(keyring.activeIndexes).deep.eq([0, 1, 2]);
    });

    it('add multiple accounts', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      await keyring.addAccounts(2);

      expect(keyring.activeIndexes).deep.eq([0, 1, 2, 3]);
    });

    it('remove a account', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.removeAccount(firstAccount.publicKey);

      expect(keyring.activeIndexes).deep.eq([1]);
    });

    it('active a single account', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.activeAccounts([6]);

      expect(keyring.activeIndexes).deep.eq([0, 1, 6]);
    });

    it('active multiple accounts', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.activeAccounts([0, 6, 7]);

      expect(keyring.activeIndexes).deep.eq([0, 1, 6, 7]);
    });

    it('get all accounts', async () => {
      const keyring = new KeystoneKeyring(initOpts);

      const accounts = await keyring.getAccountsWithBrand();

      expect(accounts).deep.eq([
        {
          address: firstAccount.publicKey,
          index: firstAccount.index
        },
        {
          address: secondAccount.publicKey,
          index: secondAccount.index
        }
      ]);
    });
  });

  describe('change hdPath', () => {
    it('change m/44 to m/84', async () => {
      const keyring = new KeystoneKeyring(initOpts);
      keyring.changeHdPath(initOpts.keys[2].path);
      const accounts = await keyring.getAccounts();
      expect(accounts).deep.eq([
        '029045ad4453414ca9cf64ca4afeec6ead859ee9a60f259b08509b014c156b3a6b',
        '02a80a1cddc6ef06fe5b383e1c59c58dc92e7cb533e8fec15d04a1307cb71b0ac0'
      ]);
    });

    // change m/44 to change address
    it('change m/44 to change address', async () => {
      const keyring = new KeystoneKeyring(initOpts);
      keyring.changeChangeAddressHdPath("m/44'/0'/0'/1");
      const accounts = await keyring.getAccounts();
      expect(accounts).deep.eq([]);
    });

    it('get account by hdPath', async () => {
      const keyring = new KeystoneKeyring(initOpts);
      const account = keyring.getAccountByHdPath(initOpts.keys[2].path, 0);
      expect(account).eq('029045ad4453414ca9cf64ca4afeec6ead859ee9a60f259b08509b014c156b3a6b');
    });

    it('get change address account by hdPath', async () => {
      const keyring = new KeystoneKeyring(initOpts);
      const account = keyring.getChangeAddressAccountByHdPath("m/44'/0'/0'/1", 0);
      expect(account).eq('026cc2828e3163f567fa63a20215260dba29bca82b3a1a4e81622fd02a275e2f99');
    });
  });
});
