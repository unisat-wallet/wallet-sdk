import bigInt from "big-integer";
function try_decode(buf) {
  let n = bigInt(0);
  let m = bigInt(1);

  for (let i = 0; ; i++) {
    if (i >= buf.length) {
      throw new Error("Buffer too short");
    }

    let byte = bigInt(buf.readUInt8(i));
    n = n.plus(byte.and(0x7f).multiply(m));

    if (byte.and(0x80).equals(0)) {
      return [n.toString(), i + 1];
    }

    m = m.shiftLeft(7);
  }
}

function encodeToVec(n, v) {
  n = bigInt(n);
  while (n.shiftRight(7).greater(0)) {
    v.push(n.and(0b01111111).or(0b10000000).toJSNumber());
    n = n.shiftRight(7);
  }
  v.push(n.toJSNumber());
}

function decode(buffer) {
  const ret = try_decode(buffer);
  return { num: ret[0], index: ret[1] };
}

function encode(n) {
  let v = [];
  encodeToVec(n, v);
  return Buffer.from(new Uint8Array(v));
}

export const varint = {
  encode,
  decode,
  try_decode,
  encodeToVec,
};
