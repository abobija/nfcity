import { PiccKey } from "../Picc";
import { DataBlockGroupType } from "./blocks/MifareClassicDataBlock";
import { ManufacturerBlockGroupType } from "./blocks/MifareClassicManufacturerBlock";
import { SectorTrailerBlockGroupType } from "./blocks/MifareClassicSectorTrailerBlock";
import { UndefinedBlockGroupType } from "./blocks/MifareClassicUndefinedBlock";
import { ValueBlockGroupType } from "./blocks/MifareClassicValueBlock";
import { allowedOperationsForKeyType, keyTypeCan, MifareClassicBlockOperation, MifareClassicKeyPermissions } from "./MifareClassic";
import MifareClassicBlock from "./MifareClassicBlock";

export type MifareClassicBlockGroupType =
  | UndefinedBlockGroupType
  | SectorTrailerBlockGroupType
  | DataBlockGroupType
  | ValueBlockGroupType
  | ManufacturerBlockGroupType;

export default class MifareClassicBlockGroup<
  T extends MifareClassicBlockGroupType = MifareClassicBlockGroupType
> {
  private _block?: MifareClassicBlock<T>;

  constructor(
    readonly type: T,
    readonly offset: number,
    readonly length: number,
    readonly accessConditions: Partial<MifareClassicKeyPermissions> = {},
  ) {
    this.type = type;
    this.offset = offset;
    this.length = length;
    this._block = undefined;
  }

  get block(): MifareClassicBlock<T> {
    if (this._block === undefined) {
      throw new Error('Block not set');
    }

    return this._block;
  }

  set block(block: MifareClassicBlock<T>) {
    if (this._block !== undefined) {
      throw new Error('Block already set');
    }

    this._block = block;
  }

  allowedOperationsFor(key: PiccKey): MifareClassicBlockOperation[] {
    return allowedOperationsForKeyType(key.type, this.accessConditions, this.block.accessBitsCombo);
  }

  keyCan(key: PiccKey, operation: MifareClassicBlockOperation): boolean {
    return keyTypeCan(key.type, operation, this.accessConditions, this.block.accessBitsCombo);
  }

  hasSameTypeAs(that: MifareClassicBlockGroup<T>): boolean {
    return this.type === that.type;
  }

  isSameAs(that: MifareClassicBlockGroup<T>): boolean {
    return this.block.hasSameAddressAs(that.block)
      && this.offset === that.offset
      && this.length === that.length;
  }

  data(): number[] {
    return this.block.data.slice(this.offset, this.offset + this.length);
  }
};
