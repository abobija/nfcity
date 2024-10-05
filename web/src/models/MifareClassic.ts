import PiccBlockDto from "@/comm/dtos/PiccBlockDto";
import PiccDto from "@/comm/dtos/PiccDto";
import { arrEquals, nibbles } from "@/helpers";
import Picc, { PiccBlock, PiccBlockAccessBits, PiccKey, PiccKeyType, PiccMemory, PiccSector, PiccState, PiccType } from "@/models/Picc";

export const defaultKey: PiccKey = {
  type: PiccKeyType.A,
  value: Uint8Array.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
};

export enum MifareClassicBlockByteGroupType {
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

export class MifareClassicBlockByteGroup {
  readonly type: MifareClassicBlockByteGroupType;
  readonly offset: number;
  readonly length: number;

  protected constructor(type: MifareClassicBlockByteGroupType, offset: number, length: number) {
    this.type = type;
    this.offset = offset;
    this.length = length;
  }

  static from(type: MifareClassicBlockByteGroupType, offset: number, length: number) {
    return new MifareClassicBlockByteGroup(type, offset, length);
  }
};

export abstract class MifareClassicBlock implements PiccBlock {
  static readonly size: number = 16;

  readonly type: MifareClassicBlockType;
  readonly sector: MifareClassicSector;
  readonly address: number;
  readonly offset: number;
  readonly data: Uint8Array;
  readonly accessBits: PiccBlockAccessBits;
  readonly byteGroups: MifareClassicBlockByteGroup[];

  protected constructor(type: MifareClassicBlockType, sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits, bytesGroups: MifareClassicBlockByteGroup[]) {
    this.type = type;
    this.sector = sector;
    this.address = block.address;
    this.offset = block.offset;
    this.data = block.data;
    this.accessBits = accessBits;
    this.byteGroups = bytesGroups;
  }

  get loaded(): Boolean {
    return this.data.length == MifareClassicBlock.size;
  }
}

export class MifareClassicUndefinedBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, offset: number) {
    return new MifareClassicUndefinedBlock(
      MifareClassicBlockType.Undefined,
      sector,
      {
        offset,
        address: sector.block0Address + offset,
        data: new Uint8Array(0),
      },
      { c1: 0, c2: 0, c3: 0 },
      [
        MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Undefined, 0, MifareClassicBlock.size),
      ]);
  }
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  readonly accessBitsPool: Array<PiccBlockAccessBits>;

  constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBitsPool: Array<PiccBlockAccessBits>) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(MifareClassicBlockType.SectorTrailer, sector, block, accessBitsPool[3], [
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.KeyA, 0, 6),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.AccessBits, 6, 3),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.UserByte, 9, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.KeyB, 10, 6),
    ]);

    this.accessBitsPool = accessBitsPool;
  }

  static from(sector: MifareClassicSector, block: PiccBlockDto) {
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

    return new MifareClassicSectorTrailerBlock(sector, block, accessBitsPool);
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

  private static checkAccessBitsIntegrityViolation(trailerData: Uint8Array): Boolean {
    const [c2_, c1_] = nibbles(trailerData[6]);
    const [c1, c3_] = nibbles(trailerData[7]);
    const [c3, c2] = nibbles(trailerData[8]);

    return (c1 != (~c1_ & 0x0F)) || (c2 != (~c2_ & 0x0F)) || (c3 != (~c3_ & 0x0F));
  }
}

export class MifareClassicDataBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    return new MifareClassicDataBlock(MifareClassicBlockType.Data, sector, block, accessBits, [
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Data, 0, MifareClassicBlock.size),
    ]);
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    // TODO: Parse

    return new MifareClassicValueBlock(MifareClassicBlockType.Value, sector, block, accessBits, [
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Value, 0, 4),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.ValueInverted, 4, 4),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Value, 8, 4),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Address, 12, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.AddressInverted, 13, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.Address, 14, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.AddressInverted, 15, 1),
    ]);
  }

  static isValueBlock(accessBits: PiccBlockAccessBits): Boolean {
    const bits = (accessBits.c1 << 2) | (accessBits.c2 << 1) | (accessBits.c3 << 0);

    return bits == 0b110 || bits == 0b001;
  }
}

export class MifareClassicManufacturerBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    const { uid } = sector.memory.picc;

    return new MifareClassicManufacturerBlock(MifareClassicBlockType.Manufacturer, sector, block, accessBits, [
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.UID, 0, uid.length),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.BCC, uid.length, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.SAK, uid.length + 1, 1),
      MifareClassicBlockByteGroup.from(MifareClassicBlockByteGroupType.ATQA, uid.length + 2, 2),
      MifareClassicBlockByteGroup.from(
        MifareClassicBlockByteGroupType.ManufacturerData,
        uid.length + 4,
        MifareClassicBlock.size - uid.length - 4
      ),
    ]);
  }
}

export class MifareClassicSector implements PiccSector {
  readonly memory: MifareClassicMemory;
  readonly offset: number;
  readonly blocks: Map<number, MifareClassicBlock>;
  readonly block0Address: number;

  protected constructor(memory: MifareClassicMemory, offset: number, blocks: Map<number, MifareClassicBlock>) {
    this.memory = memory;
    this.offset = offset;
    this.blocks = blocks;
    this.block0Address = MifareClassicMemory.sectorBlock0Address(offset);
  }

  static from(memory: MifareClassicMemory, offset: number, blocks: Map<number, MifareClassicBlock>) {
    return new MifareClassicSector(memory, offset, blocks);
  }

  // returns true if none of the blocks in the sector are loaded
  get isEmpty() {
    return Array.from(this.blocks.values()).every(block => !block.loaded);
  }

  blockAt(blockOffset: number): MifareClassicBlock {
    return this.blocks.get(blockOffset)!;
  }
}

export class MifareClassicMemory implements PiccMemory {
  readonly picc: MifareClassic;
  readonly sectors: Map<number, MifareClassicSector>;
  readonly numberOfSectors: number;
  readonly blockDistribution: Array<[number, number]>;
  readonly size: number;
  private _updateBlockCounter: number = 0;
  private _updateSectorCounter: number = 0;

  protected constructor(picc: MifareClassic, piccType: PiccType) {
    this.picc = picc;
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    // Initialize sectors
    this.sectors = new Map(
      Array.from({ length: this.numberOfSectors }).map((_, sectorOffset) => {
        const sector = MifareClassicSector.from(this, sectorOffset, new Map());

        // Initialize sector blocks
        Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })
          .forEach((_, blockOffset) => {
            sector.blocks.set(blockOffset, MifareClassicUndefinedBlock.from(sector, blockOffset))
          });

        return [sectorOffset, sector];
      })
    );

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

  static from(picc: MifareClassic, piccType: PiccType) {
    return new MifareClassicMemory(picc, piccType);
  }

  get isEmpty() {
    return this._updateBlockCounter <= 0;
  }

  get updateSectorCounter() {
    return this._updateSectorCounter;
  }

  sectorAt(sectorOffset: number): MifareClassicSector {
    return this.sectors.get(sectorOffset)!;
  }

  private updateBlock(block: PiccBlockDto): void {
    const sectorOffset = MifareClassicMemory.sectorOffset(block.address);
    const sector = this.sectorAt(sectorOffset);
    const numberOfBlocks = MifareClassicMemory.numberOfBlocksInSector(sectorOffset);

    if (block.offset == numberOfBlocks - 1) {
      sector.blocks.set(block.offset, MifareClassicSectorTrailerBlock.from(sector, block));
      return;
    }

    const trailer = sector.blocks.get(numberOfBlocks - 1);

    if (trailer === undefined || !(trailer instanceof MifareClassicSectorTrailerBlock)) {
      throw new Error('Trailer block not found');
    }

    const accessPoolIndex = MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(block.offset, numberOfBlocks);
    const accessBits = trailer.accessBitsPool[accessPoolIndex];

    if (block.address == 0) {
      sector.blocks.set(block.offset, MifareClassicManufacturerBlock.from(sector, block, accessBits));
      return;
    }

    if (MifareClassicValueBlock.isValueBlock(accessBits)) {
      sector.blocks.set(block.offset, MifareClassicValueBlock.from(sector, block, accessBits));
      return
    }

    sector.blocks.set(block.offset, MifareClassicDataBlock.from(sector, block, accessBits));

    this._updateBlockCounter++;
  }

  updateSector(blocks: PiccBlockDto[]): void {
    if (blocks.length < 4) {
      throw new Error('Invalid number of blocks');
    }

    blocks
      .sort((a, b) => b.address - a.address) // Sort so that trailer block is first
      .forEach(block => this.updateBlock(block));

    this._updateSectorCounter++;
  }

  static numberOfBlocksInSector(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  static sectorOffset(blockAddress: number): number {
    if (blockAddress < 128) {
      return Math.floor(blockAddress / 4);
    }

    return 32 + Math.floor((blockAddress - 128) / 16);
  }

  static sectorBlock0Address(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return sectorOffset * 4;
    }

    return 128 + (sectorOffset - 32) * 16;
  }

  static blockOffset(blockAddress: number, sectorOffset: number): number {
    return blockAddress - MifareClassicMemory.sectorBlock0Address(sectorOffset);
  }

  static numberOfSectors(type: PiccType): number {
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
  state: PiccState;
  readonly atqa: number;
  readonly sak: number;
  readonly uid: Uint8Array;
  readonly memory: MifareClassicMemory;

  protected constructor(picc: Picc) {
    this.type = picc.type;
    this.state = picc.state;
    this.atqa = picc.atqa;
    this.sak = picc.sak;
    this.uid = picc.uid;
    this.memory = MifareClassicMemory.from(this, picc.type);
  }

  static fromDto(piccDto: PiccDto): MifareClassic {
    return new MifareClassic({
      type: piccDto.type,
      state: piccDto.state,
      atqa: piccDto.atqa,
      sak: piccDto.sak,
      uid: piccDto.uid,
      memory: {} as PiccMemory
    });
  }

  hasUidOf(picc: Picc | PiccDto): boolean {
    return arrEquals(this.uid, picc.uid);
  }

  static dtoIsMifareClassic(piccDto: PiccDto): boolean {
    return piccDto.type === PiccType.Mifare1K || piccDto.type === PiccType.Mifare4K
      || piccDto.type === PiccType.MifareMini;
  }
}
