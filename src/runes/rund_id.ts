import bigInt from "big-integer";

export class RuneId {
  block: number;
  tx: number;

  constructor({ block, tx }: { block: number; tx: number }) {
    this.block = block;
    this.tx = tx;
  }

  static fromBigInt(n) {
    const bigN = bigInt(n);
    const block = bigN.shiftRight(16);
    const tx = bigN.and(0xffff);

    if (
      block.greater(Number.MAX_SAFE_INTEGER) ||
      tx.greater(Number.MAX_SAFE_INTEGER)
    ) {
      throw new Error("Integer overflow");
    }
    return new RuneId({ block: block.toJSNumber(), tx: tx.toJSNumber() });
  }
  toString() {
    return `${this.block}:${this.tx}`;
  }

  static fromString(s: string) {
    const [block, tx] = s.split(":").map(Number);
    return new RuneId({ block, tx });
  }
}
