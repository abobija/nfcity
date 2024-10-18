import { PiccBlock } from "../../Picc";
import { MifareClassicBlockType, valueBlockAccessConditions, ValueBlockGroupType } from "../MifareClassic";
import MifareClassicBlock from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

export class MifareClassicValueBlock extends MifareClassicBlock<ValueBlockGroupType> {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    // TODO: Parse

    super(MifareClassicBlockType.Value, sector, block, [
      new MifareClassicBlockGroup('Value', 0, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup('ValueInverted', 4, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup('Value', 8, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup('Address', 12, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup('AddressInverted', 13, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup('Address', 14, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup('AddressInverted', 15, 1, valueBlockAccessConditions),
    ]);
  }
}
