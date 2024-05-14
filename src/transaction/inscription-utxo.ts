import { UTXO_DUST } from '../constants';
import { UnspentOutput } from '../types';

export class InscriptionUnit {
  satoshis: number; // satoshis of this unit
  inscriptions: {
    id: string; // inscriptionId, to identify unit
    outputOffset: number; // offset in UTXO
    unitOffset: number; // offset in this unit
  }[];
  constructor(
    satoshis: number,
    inscriptions: {
      id: string;
      outputOffset: number;
      unitOffset: number;
    }[]
  ) {
    this.satoshis = satoshis;
    this.inscriptions = inscriptions;
  }

  hasInscriptions() {
    return this.inscriptions.length > 0;
  }
}

export class InscriptionUnspendOutput {
  inscriptionUnits: InscriptionUnit[];
  utxo: UnspentOutput;
  constructor(utxo: UnspentOutput, outputValue?: number) {
    this.utxo = utxo;
    this.split(utxo.satoshis, utxo.inscriptions, outputValue);
  }

  // split the UTXO to units
  private split(
    satoshis: number,
    inscriptions: { inscriptionId: string; offset: number }[],
    splitOutputValue = UTXO_DUST
  ) {
    const inscriptionUnits: InscriptionUnit[] = [];
    let leftAmount = satoshis;
    for (let i = 0; i < inscriptions.length; i++) {
      const id = inscriptions[i].inscriptionId;
      const offset = inscriptions[i].offset;

      const usedSatoshis = satoshis - leftAmount;
      const curOffset = offset - usedSatoshis;
      if (curOffset < 0 || leftAmount < splitOutputValue) {
        if (inscriptionUnits.length == 0) {
          inscriptionUnits.push(
            new InscriptionUnit(leftAmount, [
              {
                id: id,
                outputOffset: offset,
                unitOffset: curOffset
              }
            ])
          );
          leftAmount = 0;
        } else {
          // injected to previous
          const preUnit = inscriptionUnits[inscriptionUnits.length - 1];
          preUnit.inscriptions.push({
            id,
            outputOffset: offset,
            unitOffset: preUnit.satoshis + curOffset
          });
          continue;
        }
      }

      if (leftAmount >= curOffset) {
        if (leftAmount > splitOutputValue * 2) {
          if (curOffset >= splitOutputValue) {
            inscriptionUnits.push(new InscriptionUnit(curOffset, []));
            inscriptionUnits.push(
              new InscriptionUnit(splitOutputValue, [
                {
                  id,
                  outputOffset: offset,
                  unitOffset: 0
                }
              ])
            );
          } else {
            inscriptionUnits.push(
              new InscriptionUnit(curOffset + splitOutputValue, [
                {
                  id,
                  outputOffset: offset,
                  unitOffset: curOffset
                }
              ])
            );
          }
        } else {
          inscriptionUnits.push(
            new InscriptionUnit(curOffset + splitOutputValue, [{ id, outputOffset: offset, unitOffset: curOffset }])
          );
        }
      }

      leftAmount -= curOffset + splitOutputValue;
    }

    if (leftAmount > UTXO_DUST) {
      inscriptionUnits.push(new InscriptionUnit(leftAmount, []));
    } else if (leftAmount > 0) {
      if (inscriptionUnits.length > 0) {
        inscriptionUnits[inscriptionUnits.length - 1].satoshis += leftAmount;
      } else {
        inscriptionUnits.push(new InscriptionUnit(leftAmount, []));
      }
    }

    this.inscriptionUnits = inscriptionUnits;
  }

  /**
   * Get non-Ord satoshis for spending
   */
  getNonInscriptionSatoshis() {
    return this.inscriptionUnits.filter((v) => v.inscriptions.length == 0).reduce((pre, cur) => pre + cur.satoshis, 0);
  }

  /**
   * Get last non-ord satoshis for spending.
   * Only the last one is available
   * @returns
   */
  getLastUnitSatoshis() {
    const last = this.inscriptionUnits[this.inscriptionUnits.length - 1];
    if (last.inscriptions.length == 0) {
      return last.satoshis;
    }
    return 0;
  }

  hasInscriptions() {
    return this.utxo.inscriptions.length > 0;
  }

  // print each units
  dump() {
    this.inscriptionUnits.forEach((v) => {
      console.log('satoshis:', v.satoshis, 'inscriptions:', v.inscriptions);
    });
  }
}
