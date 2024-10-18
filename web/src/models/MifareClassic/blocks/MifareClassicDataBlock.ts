import {
  blockSize
} from "@/models/MifareClassic/MifareClassic";
import { AccessBitsCombo, MifareClassicBlockOperation, MifareClassicKeyPermissions } from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicBlock, { MifareClassicBlockType } from "@/models/MifareClassic/MifareClassicBlock";
import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { PiccBlock, PiccKey } from "@/models/Picc";
import { assert } from "@/utils/helpers";

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
