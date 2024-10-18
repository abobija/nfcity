import { assert } from "@/utils/helpers";
import { PiccBlock, PiccKey } from "../../Picc";
import { AccessBitsCombo, AccessBitsPool, accessBitsPoolFromSectorTrailerData, AccessBitsPoolIndex, isAccessBitsPoolIndex, MifareClassicKeyPermissions } from "../MifareClassic";
import MifareClassicBlock, { MifareClassicBlockType } from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

export const sectorTrailerBlockGroupNames = ['KeyA', 'AccessBits', 'UserByte', 'KeyB'] as const;

export type SectorTrailerBlockGroupType = typeof sectorTrailerBlockGroupNames[number];

export const sectorTrailerCombos: AccessBitsCombo[] = [
  0b000,
  0b010,
  0b100,
  0b110,
  0b001,
  0b011,
  0b101,
  0b111,
];

export const sectorTrailerDefaultCombo: AccessBitsCombo = 0b001;

export const keyAAccessConditions: Partial<MifareClassicKeyPermissions> =
{
  read: {
    keyA: [],
    keyB: [],
  },
  write: {
    keyA: [0b000, 0b001],
    keyB: [0b100, 0b011],
  },
};

export const accessBitsAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
  },
  write: {
    keyA: [0b001],
    keyB: [0b011, 0b101],
  },
};

export const keyBAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b001],
    keyB: [0b000, 0b010, 0b001],
  },
  write: {
    keyA: [0b000, 0b001],
    keyB: [0b100, 0b011],
  },
};

export const sectorTrailerAccessConditions: Map<SectorTrailerBlockGroupType, Partial<MifareClassicKeyPermissions>> = new Map([
  ['KeyA', keyAAccessConditions],
  ['AccessBits', accessBitsAccessConditions],
  ['UserByte', accessBitsAccessConditions],
  ['KeyB', keyBAccessConditions],
]);

export default class MifareClassicSectorTrailerBlock extends MifareClassicBlock<SectorTrailerBlockGroupType> {
  readonly accessBitsPool: AccessBitsPool;

  constructor(
    sector: MifareClassicSector,
    block: Omit<PiccBlock, 'accessBits'>,
  ) {
    const _accessBitsPool = accessBitsPoolFromSectorTrailerData(block.data);

    super(
      MifareClassicBlockType.SectorTrailer,
      sector,
      { ...block, accessBits: _accessBitsPool[3] },
      [
        new MifareClassicBlockGroup('KeyA', 0, 6, keyAAccessConditions),
        new MifareClassicBlockGroup('AccessBits', 6, 3, accessBitsAccessConditions),
        new MifareClassicBlockGroup('UserByte', 9, 1, accessBitsAccessConditions),
        new MifareClassicBlockGroup('KeyB', 10, 6, keyBAccessConditions),
      ]
    );

    this.accessBitsPool = _accessBitsPool;
  }

  keyCanWriteToAnyGroup(key: PiccKey): boolean {
    return this.groups.some(group => group.keyCan(key, 'write'));
  }

  static calculateBlockAccessBitsPoolIndex(blockOffset: number, numberOfBlocks: number): AccessBitsPoolIndex {
    let index = blockOffset;

    if (numberOfBlocks > 4) {
      index = Math.floor(blockOffset / 5);
    }

    assert(isAccessBitsPoolIndex(index));

    return index;
  }
}
