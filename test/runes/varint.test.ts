import { expect } from 'chai';
import { varint } from '../../src/runes';

describe('varint', () => {
  describe('encode', function () {
    const testAmounts = [
      ['2100000', 'a0968001'],
      ['2099006', 'be8e8001'],
      ['2099950', 'ee958001'],
      ['210', 'd201'],
      ['21000', '88a401'],
      ['210000', 'd0e80c'],
      ['2100000', 'a0968001'],
      ['2100000000', '80eaade907'],
      ['210000000000', '80e8e6a78e06'],
      ['2100000000000000000', '8080c8e2fadbac921d'],
      ['2100000000000000000000', '8080c08292b7aeadd7e301']
    ];
    for (const [amount, hex] of testAmounts) {
      it(`encode ${amount}`, function () {
        expect(varint.encode(amount).toString('hex')).to.equal(hex);
      });
    }
  });
});
