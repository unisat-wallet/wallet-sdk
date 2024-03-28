import { expect } from "chai";
import { KeystoneKeyring } from "../../src/keyring";

const initOpts = {
  mfp: "52744703",
  keys: [
    {
      path: "m/44'/0'/0'",
      extendedPublicKey: "xpub6CWL8m4zcbAPXjWkfFWkyjkorenkhBV8P6VFFCmoMn9WZZZhC3ehf7jovLr5HYXGnHZXZbEBFCWo6KqZiqzaV1gMMc5fdprGiWiaA6vynpA",
    },
    {
      path: "m/49'/0'/0'",
      extendedPublicKey: "xpub6CK8ZyoANWjWk24vmGhZ3V5x28QinZ3C66P3es5oDgtrvZLDK8txJHXu88zKsGc3WA7HFUDPHYcoWir4j2cMNMKBBhfHCB37StVhxozA5Lp",
    },
    {
      path: "m/84'/0'/0'",
      extendedPublicKey: "xpub6CcBrNAXBhrdb29q4BFApXgKgCdnHevzGnwFKnDSYfWWMcqkbH17ay6vaUJDZxFdZx5y5AdcoEzLfURSdwtQEEZ93Y5VXUSJ9S8hm5SY7Si",
    },
    {
      path: "m/86'/0'/0'",
      extendedPublicKey: "xpub6Cq9mdT8xwFe9LYQnt9y1hJXTyo7KQJM8pRH6K95F1mbELzgm825m3hyAZ97vsUV8Xh7VRwu7bKuLZEmUV1ABqCRQqFzZHAsfaJXTYSY1cf",
    }
  ],
  hdPath: "m/44'/0'/0'",
  activeIndexes: [0, 1],
}

const firstAccount = {
  index: 0,
  path: "m/44'/0'/0'/0/0",
  publicKey: "03595bab1a88ddd75f04205b8533cd8d1ce2b2a24ebe164d6ad6a1f4945aed3f99",
};
const secondAccount = {
  index: 1,
  path: "m/44'/0'/0'/0/1",
  publicKey: "02aea7c5fa9074943e0821d7db0f2a2114a8694a9a24237e8a452056340d47c0f3",
};

describe("bitcoin-keystone-keyring", () => {
  describe("constructor", () => {
    it("constructs", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      const accounts = await keyring.getAccounts();
      
      expect(accounts).deep.eq([firstAccount.publicKey, secondAccount.publicKey]);
    });
  });

  describe("manage accounts", () => {
    it("add a single account", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      await keyring.addAccounts(1);
      
      expect(keyring.activeIndexes).deep.eq([0, 1, 2]);
    });

    it("add multiple accounts", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      await keyring.addAccounts(2);
      
      expect(keyring.activeIndexes).deep.eq([0, 1, 2, 3]);
    });

    it("remove a account", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.removeAccount(firstAccount.publicKey);
      
      expect(keyring.activeIndexes).deep.eq([1]);
    });

    it("active a single account", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.activeAccounts([6]);
      
      expect(keyring.activeIndexes).deep.eq([0, 1, 6]);
    });

    it("active multiple accounts", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      keyring.activeAccounts([0, 6, 7]);
      
      expect(keyring.activeIndexes).deep.eq([0, 1, 6, 7]);
    });

    it("get all accounts", async () => {
      const keyring = new KeystoneKeyring(initOpts);

      const accounts = await keyring.getAccountsWithBrand();
      
      expect(accounts).deep.eq([{
        address: firstAccount.publicKey,
        index: firstAccount.index,
      }, {
        address: secondAccount.publicKey,
        index: secondAccount.index,
      }]);
    });
  });

  describe("change hdPath", () => {
    it("change m/44 to m/84", async () => {
      const keyring = new KeystoneKeyring(initOpts);
      keyring.changeHdPath(initOpts.keys[2].path);
      const accounts = await keyring.getAccounts();
      expect(accounts).deep.eq([
        "029045ad4453414ca9cf64ca4afeec6ead859ee9a60f259b08509b014c156b3a6b",
        "02a80a1cddc6ef06fe5b383e1c59c58dc92e7cb533e8fec15d04a1307cb71b0ac0",
      ]);
    });

    it("get account by hdPath", async () => {
      const keyring = new KeystoneKeyring(initOpts);
      const account = keyring.getAccountByHdPath(initOpts.keys[2].path, 0);
      expect(account).eq(
        "029045ad4453414ca9cf64ca4afeec6ead859ee9a60f259b08509b014c156b3a6b"
      );
    });
  });
})
