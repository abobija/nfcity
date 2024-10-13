import PiccDto from "@/communication/dtos/PiccDto";
import Picc, {
  PiccBlock,
  PiccBlockAccessBits,
  PiccKey,
  PiccMemory,
  PiccSector,
  PiccState,
  PiccType,
  UpdatablePiccBlock,
  UpdatablePiccSector,
  keyA
} from "@/models/Picc";
import { arraysAreEqual, nibbles, unhexToArray } from "@/utils/helpers";

export const keySize = 6;

const defaultKey: PiccKey = {
  type: keyA,
  value: unhexToArray('FFFFFFFFFFFF'),
};

export enum MifareClassicBlockGroupType {
  Undefined,

  // Sector trailer
  KeyA,
  AccessBits,
  UserByte,
  KeyB,

  // Value block
  Value,
  ValueInverted,
  Address,
  AddressInverted,

  // Data block
  Data,

  // Manufacturer block
  UID,
  BCC,
  SAK,
  ATQA,
  ManufacturerData,
}

export enum MifareClassicBlockType {
  Undefined,
  SectorTrailer,
  Data,
  Value,
  Manufacturer,
}

export class MifareClassicBlockGroup {
  private _block?: MifareClassicBlock;

  protected constructor(
    readonly type: MifareClassicBlockGroupType,
    readonly offset: number,
    readonly length: number
  ) {
    this.type = type;
    this.offset = offset;
    this.length = length;
    this._block = undefined;
  }

  get block(): MifareClassicBlock {
    if (this._block === undefined) {
      throw new Error('Block not set');
    }

    return this._block;
  }

  set block(block: MifareClassicBlock) {
    if (this._block !== undefined) {
      throw new Error('Block already set');
    }

    this._block = block;
  }

  public hasSameTypeAs(that: MifareClassicBlockGroup): boolean {
    return this.type === that.type;
  }

  public isSameAs(that: MifareClassicBlockGroup): boolean {
    return this.block.hasSameAddressAs(that.block)
      && this.offset === that.offset
      && this.length === that.length;
  }

  static from(
    type: MifareClassicBlockGroupType,
    offset: number,
    length: number
  ) {
    return new MifareClassicBlockGroup(type, offset, length);
  }
};

export abstract class MifareClassicBlock implements PiccBlock {
  static readonly size: number = 16;

  readonly address: number;
  private _data: number[];
  readonly accessBits: PiccBlockAccessBits;
  readonly blockGroups: MifareClassicBlockGroup[];

  get data(): number[] {
    return this._data;
  }

  protected constructor(
    readonly type: MifareClassicBlockType,
    readonly sector: MifareClassicSector,
    block: PiccBlock,
    bytesGroups: MifareClassicBlockGroup[]
  ) {
    this.type = type;
    this.sector = sector;
    this.address = block.address;
    this._data = block.data;
    this.accessBits = block.accessBits;
    bytesGroups.forEach(group => group.block = this);
    this.blockGroups = bytesGroups;
  }

  get loaded(): Boolean {
    return this.data.length == MifareClassicBlock.size;
  }

  hasSameAddressAs(that: MifareClassicBlock): boolean {
    return this.address == that.address;
  }

  updateWith(block: UpdatablePiccBlock): MifareClassicBlock {
    if (this.address != block.address) {
      throw new Error('Invalid block address');
    }

    if (block.data.length != MifareClassicBlock.size) {
      throw new Error('Invalid block data length');
    }

    this._data = block.data;

    return this;
  }
}

class MifareClassicUndefinedBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, address: number) {
    return new MifareClassicUndefinedBlock(
      MifareClassicBlockType.Undefined,
      sector,
      {
        address,
        data: [],
        accessBits: { c1: 0, c2: 0, c3: 0 },
      },
      [
        MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Undefined, 0, MifareClassicBlock.size),
      ]);
  }
}

class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  constructor(
    sector: MifareClassicSector,
    block: PiccBlock,
    readonly accessBitsPool: Array<PiccBlockAccessBits>
  ) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(MifareClassicBlockType.SectorTrailer, sector, block, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.KeyA, 0, 6),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AccessBits, 6, 3),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.UserByte, 9, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.KeyB, 10, 6),
    ]);

    this.accessBitsPool = accessBitsPool;
  }

  static from(sector: MifareClassicSector, block: Omit<PiccBlock, 'accessBits'>) {
    const { data } = block;

    if (MifareClassicSectorTrailerBlock.checkAccessBitsIntegrityViolation(data)) {
      throw new Error('Access bits integrity violation');
    }

    const [c1] = nibbles(data[7]);
    const [c3, c2] = nibbles(data[8])

    const accessBitsPool = Array<PiccBlockAccessBits>(4);

    for (let i = 0; i < 4; i++) {
      accessBitsPool[i] = this.nibblesToAccessBits(c1, c2, c3, i);
    }

    return new MifareClassicSectorTrailerBlock(
      sector,
      { ...block, accessBits: accessBitsPool[3] },
      accessBitsPool
    );
  }

  static calculateBlockAccessBitsPoolIndex(blockOffset: number, numberOfBlocks: number): number {
    if (numberOfBlocks > 4) {
      return Math.floor(blockOffset / 5);
    }

    return blockOffset;
  }

  private static nibblesToAccessBits(c1: number, c2: number, c3: number, offset: number): PiccBlockAccessBits {
    return {
      c1: (c1 & (1 << offset)) >> offset,
      c2: (c2 & (1 << offset)) >> offset,
      c3: (c3 & (1 << offset)) >> offset,
    }
  }

  private static checkAccessBitsIntegrityViolation(trailerData: number[]): Boolean {
    const [c2_, c1_] = nibbles(trailerData[6]);
    const [c1, c3_] = nibbles(trailerData[7]);
    const [c3, c2] = nibbles(trailerData[8]);

    return (c1 != (~c1_ & 0x0F)) || (c2 != (~c2_ & 0x0F)) || (c3 != (~c3_ & 0x0F));
  }
}

class MifareClassicDataBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlock) {
    return new MifareClassicDataBlock(MifareClassicBlockType.Data, sector, block, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Data, 0, MifareClassicBlock.size),
    ]);
  }
}

class MifareClassicValueBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlock) {
    // TODO: Parse

    return new MifareClassicValueBlock(MifareClassicBlockType.Value, sector, block, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Value, 0, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.ValueInverted, 4, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Value, 8, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Address, 12, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AddressInverted, 13, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Address, 14, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AddressInverted, 15, 1),
    ]);
  }

  static isValueBlock(accessBits: PiccBlockAccessBits): Boolean {
    const bits = (accessBits.c1 << 2) | (accessBits.c2 << 1) | (accessBits.c3 << 0);

    return bits == 0b110 || bits == 0b001;
  }
}

class MifareClassicManufacturerBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlock) {
    const { uid } = sector.memory.picc;

    return new MifareClassicManufacturerBlock(MifareClassicBlockType.Manufacturer, sector, block, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.UID, 0, uid.length),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.BCC, uid.length, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.SAK, uid.length + 1, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.ATQA, uid.length + 2, 2),
      MifareClassicBlockGroup.from(
        MifareClassicBlockGroupType.ManufacturerData,
        uid.length + 4,
        MifareClassicBlock.size - uid.length - 4
      ),
    ]);
  }
}

export class MifareClassicSector implements PiccSector {
  key: PiccKey = defaultKey;

  protected constructor(
    readonly memory: MifareClassicMemory,
    readonly blocks: MifareClassicBlock[]
  ) {
    this.memory = memory;
    this.blocks = blocks;
  }

  get block0Address() {
    return this.blockAtOffset(0).address;
  }

  get numberOfBlocks() {
    return this.blocks.length;
  }

  // returns true if none of the blocks in the sector are loaded
  get isEmpty() {
    return Array.from(this.blocks.values()).every(block => !block.loaded);
  }

  get trailerOffset() {
    return this.numberOfBlocks - 1;
  }

  static from(memory: MifareClassicMemory, blocks: MifareClassicBlock[]) {
    return new MifareClassicSector(memory, blocks);
  }

  private blockAtOffset(offset: number): MifareClassicBlock {
    return this.blocks.at(offset)!; // FIXME: !
  }

  private accessPoolIndexOfBlockAtOffset(blockOffset: number): number {
    return MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(
      blockOffset,
      this.numberOfBlocks
    );
  }

  updateWith(sector: UpdatablePiccSector): void {
    if (sector.blocks.length != this.numberOfBlocks) {
      throw new Error('Invalid number of blocks');
    }

    this.key = sector.key;

    const trailer = MifareClassicSectorTrailerBlock.from(this,
      sector.blocks.at(-1)! // FIXME: !
    );

    this.blocks[this.trailerOffset] = trailer;

    sector.blocks.slice(0, -1)
      .forEach((block, offset) => {
        const accessPoolIndex = this.accessPoolIndexOfBlockAtOffset(offset);
        const accessBits = trailer.accessBitsPool[accessPoolIndex];

        if (block.address === 0) {
          this.blocks[offset] = MifareClassicManufacturerBlock.from(this, { ...block, accessBits });
          return;
        }

        if (MifareClassicValueBlock.isValueBlock(accessBits)) {
          this.blocks[offset] = MifareClassicValueBlock.from(this, { ...block, accessBits });
          return;
        }

        this.blocks[offset] = MifareClassicDataBlock.from(this, { ...block, accessBits });
      });
  }
}

export class MifareClassicMemory implements PiccMemory {
  readonly sectors: MifareClassicSector[];
  readonly numberOfSectors: number;
  readonly blockDistribution: Array<[number, number]>;
  readonly size: number;

  protected constructor(readonly picc: MifareClassic, piccType: PiccType) {
    this.picc = picc;
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    // Initialize sectors
    this.sectors = [];

    let blockAddress = 0;
    for (let sectorOffset = 0; sectorOffset < this.numberOfSectors; sectorOffset++) {
      const sector = MifareClassicSector.from(this, []);
      const numberOfBlocks = MifareClassicMemory.numberOfBlocksInSector(sectorOffset);

      for (let blockOffset = 0; blockOffset < numberOfBlocks; blockOffset++) {
        const block = MifareClassicUndefinedBlock.from(sector, blockAddress++);
        sector.blocks.push(block);
      }

      this.sectors.push(sector);
    }

    if (this.numberOfSectors < 16) {
      this.blockDistribution = [[5, 4]];
    }
    else if (this.numberOfSectors < 32) {
      this.blockDistribution = [[16, 4]];
    }
    else {
      this.blockDistribution = [[32, 4], [16, 8]];
    }

    this.size = this.blockDistribution.reduce((acc, [n, m]) => acc + n * m, 0) * MifareClassicBlock.size;
  }

  get isEmpty() {
    return this.sectors.every(sector => sector.isEmpty);
  }

  static from(picc: MifareClassic, piccType: PiccType) {
    return new MifareClassicMemory(picc, piccType);
  }

  sectorAtOffset(offset: number): MifareClassicSector {
    return this.sectors.at(offset)!; // FIXME: !
  }

  offsetOfSector(sector: MifareClassicSector): number {
    return this.sectors.indexOf(sector);
  }

  blockAtAddress(address: number): MifareClassicBlock | undefined {
    for (const sector of this.sectors) {
      for (const block of sector.blocks) {
        if (block.address === address) {
          return block;
        }
      }
    }

    return undefined;
  }

  private static numberOfBlocksInSector(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  private static numberOfSectors(type: PiccType): number {
    switch (type) {
      case PiccType.Mifare1K:
        return 16;
      case PiccType.Mifare4K:
        return 40;
      case PiccType.MifareMini:
        return 5;
      default:
        throw new Error("Unsupported Mifare type");
    }
  }
}

export default class MifareClassic implements Picc {
  readonly type: PiccType;
  private _state: PiccState;
  readonly atqa: number;
  readonly sak: number;
  readonly uid: number[];
  readonly memory: MifareClassicMemory;

  protected constructor(picc: Picc) {
    this.type = picc.type;
    this._state = picc.state;
    this.atqa = picc.atqa;
    this.sak = picc.sak;
    this.uid = picc.uid;
    this.memory = MifareClassicMemory.from(this, picc.type);
  }

  get state(): PiccState {
    return this._state;
  }

  set state(state: PiccState) {
    this._state = state;
  }

  static fromDto(piccDto: PiccDto): MifareClassic {
    return new MifareClassic({
      type: piccDto.type,
      state: piccDto.state,
      atqa: piccDto.atqa,
      sak: piccDto.sak,
      uid: Array.from(piccDto.uid),
      memory: {} as PiccMemory
    });
  }

  hasUidOf(picc: Picc | PiccDto): boolean {
    return arraysAreEqual(this.uid, picc.uid);
  }

  static isMifareClassic(picc: Picc | PiccDto): boolean {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
