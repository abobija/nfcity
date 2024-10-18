import { PiccBlock } from "../../Picc";
import { blockSize, MifareClassicKeyPermissions } from "../MifareClassic";
import MifareClassicBlock, { MifareClassicBlockType } from "../MifareClassicBlock";
import MifareClassicBlockGroup from "../MifareClassicBlockGroup";
import MifareClassicSector from "../MifareClassicSector";

export const manufacturerBlockGroupNames = ['UID', 'BCC', 'SAK', 'ATQA', 'ManufacturerData'] as const;

export type ManufacturerBlockGroupType = typeof manufacturerBlockGroupNames[number];

export const manufacturerBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0, 1, 2, 3, 4, 5, 6, 7],
    keyB: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  write: {
    keyA: [],
    keyB: [],
  }
};

export class MifareClassicManufacturerBlock extends MifareClassicBlock<ManufacturerBlockGroupType> {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    const { uid } = sector.memory.picc;

    super(MifareClassicBlockType.Manufacturer, sector, block, [
      new MifareClassicBlockGroup('UID', 0, uid.length, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup('BCC', uid.length, 1, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup('SAK', uid.length + 1, 1, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup('ATQA', uid.length + 2, 2, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup(
        'ManufacturerData',
        uid.length + 4,
        blockSize - uid.length - 4,
        manufacturerBlockAccessConditions
      ),
    ]);
  }
}
