import { assert } from "@/utils/helpers";
import { PiccBlock, PiccKey } from "../../Picc";
import { AccessBitsCombo, blockSize, MifareClassicBlockOperation, MifareClassicKeyPermissions } from "../MifareClassic";
import MifareClassicBlock, { MifareClassicBlockType } from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

export const dataBlockGroupNames = ['Data'] as const;

export type DataBlockGroupType = typeof dataBlockGroupNames[number];

export const dataBlockCombos: AccessBitsCombo[] = [
  0b000,
  0b010,
  0b100,
  0b110,
  0b001,
  0b011,
  0b101,
  0b111,
];

export const dataBlockDefaultCombo: AccessBitsCombo = 0b000;

export const dataBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101],
  },
  write: {
    keyA: [0b000],
    keyB: [0b000, 0b100, 0b110, 0b011],
  }
};

export default class MifareClassicDataBlock extends MifareClassicBlock<DataBlockGroupType> {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    super(MifareClassicBlockType.Data, sector, block, [
      new MifareClassicBlockGroup('Data', 0, blockSize, dataBlockAccessConditions),
    ]);
  }

  keyCan(key: PiccKey, operation: MifareClassicBlockOperation): boolean {
    assert(this.groups.length === 1);
    return this.groups[0].keyCan(key, operation);
  }
}
