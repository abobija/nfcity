import { assert } from "@/utils/helpers";
import { PiccBlock, PiccKey } from "../../Picc";
import { blockSize, dataBlockAccessConditions, DataBlockGroupType, MifareClassicBlockOperation, MifareClassicBlockType } from "../MifareClassic";
import MifareClassicBlock from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

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
