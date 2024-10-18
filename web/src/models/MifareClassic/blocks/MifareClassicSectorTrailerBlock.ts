import { assert } from "@/utils/helpers";
import { PiccBlock, PiccKey } from "../../Picc";
import { accessBitsAccessConditions, AccessBitsPool, accessBitsPoolFromSectorTrailerData, AccessBitsPoolIndex, isAccessBitsPoolIndex, keyAAccessConditions, keyBAccessConditions, MifareClassicBlockType, SectorTrailerBlockGroupType } from "../MifareClassic";
import MifareClassicBlock from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

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
