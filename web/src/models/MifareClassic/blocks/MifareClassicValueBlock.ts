import { calculateAccessBitsCombo, MifareClassicKeyPermissions } from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicBlock, { MifareClassicBlockType } from "@/models/MifareClassic/MifareClassicBlock";
import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { PiccBlock, PiccBlockAccessBits } from "@/models/Picc";

export const valueBlockGroupNames = ['Value', 'ValueInverted', 'Address', 'AddressInverted'] as const;

export type ValueBlockGroupType = typeof valueBlockGroupNames[number];

export const valueBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  write: {
    keyA: [],
    keyB: [0b110],
  },
  increment: {
    keyA: [],
    keyB: [0b110],
  },
  decrement: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  transfer: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  restore: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
};

export function isValueBlock(accessBits: PiccBlockAccessBits): boolean {
  return [0b110, 0b001].includes(calculateAccessBitsCombo(accessBits));
}

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
