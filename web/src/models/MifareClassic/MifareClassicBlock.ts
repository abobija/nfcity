import { blockSize, } from "@/models/MifareClassic/MifareClassic";
import { AccessBitsCombo, calculateAccessBitsCombo } from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicBlockGroup, { MifareClassicBlockGroupType } from "@/models/MifareClassic/MifareClassicBlockGroup";
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { PiccBlock, PiccBlockAccessBits, UpdatablePiccBlock } from "@/models/Picc";
import { assert } from "@/utils/helpers";

export enum MifareClassicBlockType {
  Undefined,
  SectorTrailer,
  Data,
  Value,
  Manufacturer,
}

export default abstract class MifareClassicBlock<
  G extends MifareClassicBlockGroupType = MifareClassicBlockGroupType
> implements PiccBlock {
  readonly address: number;
  private _data: number[];
  readonly accessBits: PiccBlockAccessBits;
  readonly accessBitsCombo: AccessBitsCombo;
  readonly groups: MifareClassicBlockGroup<G>[];

  get data(): number[] {
    return this._data;
  }

  protected constructor(
    readonly type: MifareClassicBlockType,
    readonly sector: MifareClassicSector,
    block: PiccBlock,
    groups: MifareClassicBlockGroup<G>[]
  ) {
    this.type = type;
    this.sector = sector;
    this.address = block.address;
    this._data = block.data;
    this.accessBits = block.accessBits;
    this.accessBitsCombo = calculateAccessBitsCombo(this.accessBits);
    groups.forEach(group => group.block = this);
    this.groups = groups;
  }

  get loaded(): Boolean {
    return this.data.length === blockSize;
  }

  hasSameAddressAs(that: MifareClassicBlock<G>): boolean {
    return this.address == that.address;
  }

  updateWith(block: UpdatablePiccBlock): MifareClassicBlock<G> {
    assert(this.address == block.address, 'invalid block address');
    assert(block.data.length == blockSize, 'invalid block data length');

    this._data = block.data;

    return this;
  }

  findGroup(type: G): MifareClassicBlockGroup<G> | undefined {
    return this.groups.find(group => group.type === type);
  }
}
