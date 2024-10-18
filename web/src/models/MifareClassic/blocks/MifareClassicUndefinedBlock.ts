import { blockSize } from "../MifareClassic";
import MifareClassicBlock, { MifareClassicBlockType } from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

export const undefinedBlockGroupNames = ['Undefined'] as const;

export type UndefinedBlockGroupType = typeof undefinedBlockGroupNames[number];

export default class MifareClassicUndefinedBlock extends MifareClassicBlock<UndefinedBlockGroupType> {
  constructor(sector: MifareClassicSector, address: number) {
    super(
      MifareClassicBlockType.Undefined,
      sector,
      {
        address,
        data: [],
        accessBits: { c1: 0, c2: 0, c3: 0 },
      },
      [
        new MifareClassicBlockGroup('Undefined', 0, blockSize),
      ]);
  }
}
