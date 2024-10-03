import PiccBlockDto from "@/comm/dtos/PiccBlockDto";
import { nibbles } from "@/helpers";
import Picc, { PiccBlock, PiccBlockAccessBits, PiccKey, PiccKeyType, PiccMemory, PiccSector, PiccState, PiccType } from "@/models/Picc";

export const defaultKey: PiccKey = {
  type: PiccKeyType.A,
  value: Uint8Array.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
};

export enum MifareClassicBlockByteGroupClass {
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

export interface MifareClassicBlockByteGroup {
  offset: number;
  length?: number;
  class: MifareClassicBlockByteGroupClass;
};

export abstract class MifareClassicBlock implements PiccBlock {
  static readonly size: number = 16;

  sector: MifareClassicSector;
  address: number;
  offset: number;
  data: Uint8Array;
  accessBits: PiccBlockAccessBits;
  byteGroups: MifareClassicBlockByteGroup[];

  protected constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits, bytesGroups: MifareClassicBlockByteGroup[]) {
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
      sector,
      {
        offset,
        address: sector.block0Address + offset,
        data: new Uint8Array(0),
      },
      { c1: 0, c2: 0, c3: 0 },
      [
        { offset: 0, length: MifareClassicBlock.size, class: MifareClassicBlockByteGroupClass.Undefined },
      ]);
  }
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  readonly accessBitsPool: Array<PiccBlockAccessBits>;

  constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBitsPool: Array<PiccBlockAccessBits>) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(sector, block, accessBitsPool[3], [
      { offset: 0, length: 6, class: MifareClassicBlockByteGroupClass.KeyA },
      { offset: 6, length: 3, class: MifareClassicBlockByteGroupClass.AccessBits },
      { offset: 9, length: 1, class: MifareClassicBlockByteGroupClass.UserByte },
      { offset: 10, length: 6, class: MifareClassicBlockByteGroupClass.KeyB },
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
    return new MifareClassicDataBlock(sector, block, accessBits, [
      { offset: 0, length: MifareClassicBlock.size, class: MifareClassicBlockByteGroupClass.Data },
    ]);
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    // TODO: Parse

    return new MifareClassicValueBlock(sector, block, accessBits, [
      { offset: 0, length: 4, class: MifareClassicBlockByteGroupClass.Value },
      { offset: 4, length: 4, class: MifareClassicBlockByteGroupClass.ValueInverted },
      { offset: 8, length: 4, class: MifareClassicBlockByteGroupClass.Value },
      { offset: 12, length: 1, class: MifareClassicBlockByteGroupClass.Address },
      { offset: 13, length: 1, class: MifareClassicBlockByteGroupClass.AddressInverted },
      { offset: 14, length: 1, class: MifareClassicBlockByteGroupClass.Address },
      { offset: 15, length: 1, class: MifareClassicBlockByteGroupClass.AddressInverted },
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

    return new MifareClassicManufacturerBlock(sector, block, accessBits, [
      { offset: 0, length: uid.length, class: MifareClassicBlockByteGroupClass.UID },
      { offset: uid.length, length: 1, class: MifareClassicBlockByteGroupClass.BCC },
      { offset: uid.length + 1, length: 1, class: MifareClassicBlockByteGroupClass.SAK },
      { offset: uid.length + 2, length: 2, class: MifareClassicBlockByteGroupClass.ATQA },
      { offset: uid.length + 4, class: MifareClassicBlockByteGroupClass.ManufacturerData },
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
  readonly state: PiccState;
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

  static from(picc: Picc): MifareClassic {
    return new MifareClassic(picc);
  }

  static isMifareClassic(picc: Picc): picc is MifareClassic {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
